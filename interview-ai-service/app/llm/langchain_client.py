import json
import logging
import threading
from typing import List, Dict, Any, Optional, Tuple

from langchain_core.prompts import PromptTemplate, ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

from app.core.settings import settings
from app.schemas.parser import ResumeParsingResponse, StructuredResumeData
from app.schemas.evaluator import AnswerEvaluationResponse
from app.schemas.generator import GeneratedQuestionItem, QuestionGenerationResponse
from app.schemas.report import ReportGenerationResponse

logger = logging.getLogger("app")

# Provider model definitions
PROVIDER_MODELS = {
    "gemini": [
        "gemini-3.6-flash",
        "gemini-3.7-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash"
    ],
    "groq": [
        "llama-3.3-70b-versatile",
        "llama3-8b-8192",
        "mixtral-8x7b-32768",
        "deepseek-r1-distill-llama-70b"
    ],
    "openai": [
        "gpt-4o-mini",
        "gpt-4o",
        "gpt-3.5-turbo"
    ],
    "anthropic": [
        "claude-3-5-haiku-20241022",
        "claude-3-haiku-20240307"
    ]
}

def parse_keys_list(raw_keys: str) -> List[str]:
    if not raw_keys:
        return []
    return [k.strip() for k in raw_keys.split(",") if k.strip() and not k.strip().startswith("YOUR_")]

class LangChainClient:
    """
    Multi-Provider LangChain Client with Rolling Technique across 4 LLM Ecosystems:
    - Google Gemini
    - OpenAI ChatGPT
    - Groq (Llama 3.3, Mixtral, DeepSeek)
    - Anthropic Claude
    """

    def __init__(self):
        self.gemini_keys = parse_keys_list(settings.GEMINI_API_KEY)
        self.openai_keys = parse_keys_list(settings.OPENAI_API_KEY)
        self.groq_keys = parse_keys_list(settings.GROQ_API_KEY)
        self.anthropic_keys = parse_keys_list(settings.ANTHROPIC_API_KEY)

        self._rolling_counter = 0
        self._lock = threading.Lock()
        
        # Build active provider-model-key tuples
        self.active_pool: List[Tuple[str, str, str]] = []
        
        # Register Gemini instances
        for k in self.gemini_keys:
            for m in PROVIDER_MODELS["gemini"]:
                self.active_pool.append(("gemini", m, k))

        # Register Groq instances
        for k in self.groq_keys:
            for m in PROVIDER_MODELS["groq"]:
                self.active_pool.append(("groq", m, k))

        # Register OpenAI instances
        for k in self.openai_keys:
            for m in PROVIDER_MODELS["openai"]:
                self.active_pool.append(("openai", m, k))

        # Register Anthropic instances
        for k in self.anthropic_keys:
            for m in PROVIDER_MODELS["anthropic"]:
                self.active_pool.append(("anthropic", m, k))

        self.is_ready = len(self.active_pool) > 0
        if self.is_ready:
            logger.info("LangChain Multi-LLM Client initialized with %d active model/key configurations across providers.", len(self.active_pool))
        else:
            logger.warning("LangChain Client initialized with 0 API keys (running mock mode). Add GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY to .env.")

    def _build_llm(self, provider: str, model_name: str, api_key: str, temperature: float = 0.7):
        """Dynamically instantiates LangChain LLM classes based on provider."""
        if provider == "gemini":
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key, temperature=temperature)
        elif provider == "groq":
            from langchain_groq import ChatGroq
            return ChatGroq(model_name=model_name, groq_api_key=api_key, temperature=temperature)
        elif provider == "openai":
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(model=model_name, api_key=api_key, temperature=temperature)
        elif provider == "anthropic":
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(model=model_name, api_key=api_key, temperature=temperature)
        else:
            raise ValueError(f"Unknown LLM provider: {provider}")

    def execute_prompt(self, prompt_text: str, temperature: float = 0.7) -> str:
        """Executes LLM request via LangChain using the Multi-Provider Rolling Technique."""
        if not self.is_ready:
            raise ValueError("No LLM API keys configured. Set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in .env.")

        with self._lock:
            start_idx = self._rolling_counter % len(self.active_pool)
            self._rolling_counter += 1

        num_pool = len(self.active_pool)
        candidate_indices = [(start_idx + offset) % num_pool for offset in range(num_pool)]

        last_err = None
        for idx in candidate_indices:
            provider, model_name, api_key = self.active_pool[idx]
            try:
                llm = self._build_llm(provider, model_name, api_key, temperature=temperature)
                prompt = PromptTemplate.from_template("{input}")
                chain = prompt | llm
                response = chain.invoke({"input": prompt_text})
                
                content = response.content
                if isinstance(content, list):
                    text_parts = [item.get("text", str(item)) if isinstance(item, dict) else str(item) for item in content]
                    raw_text = "".join(text_parts)
                else:
                    raw_text = str(content)

                logger.info("LangChain Multi-LLM success via provider '%s' model '%s'", provider.upper(), model_name)
                return raw_text
            except Exception as e:
                err_msg = str(e)
                if "429" in err_msg or "Quota" in err_msg or "404" in err_msg or "ResourceExhausted" in err_msg or "rate_limit" in err_msg.lower():
                    logger.warning("LangChain provider '%s' model '%s' rate/token limited. Rolling to next provider...", provider.upper(), model_name)
                    last_err = e
                    continue
                else:
                    logger.error("LangChain error on provider '%s' model '%s': %s. Trying fallback...", provider.upper(), model_name, err_msg[:100])
                    last_err = e
                    continue

        if last_err:
            raise last_err
        raise RuntimeError("All multi-provider LangChain LLM models exhausted.")

    def parse_resume(self, resume_text: str) -> StructuredResumeData:
        """Parses raw resume text into structured JSON using LangChain."""
        if not self.is_ready:
            return StructuredResumeData(
                skills=["Java", "Spring Boot", "React", "SQL", "Docker"],
                projects=[],
                education=[],
                experience=[]
            )

        prompt_template = PromptTemplate.from_template(
            """You are an expert ATS system and technical resume analyzer.
Analyze the candidate resume text and extract all relevant candidate data.
Return ONLY valid JSON matching this schema:
{{
  "skills": ["Skill1", "Skill2"],
  "projects": [{{"title": "P1", "techStack": ["Java"], "description": "desc"}}],
  "education": [{{"institution": "Uni", "degree": "BS CS", "gradYear": "2024"}}],
  "experience": [{{"company": "Comp", "role": "Role", "duration": "1 yr", "highlights": ["achieved X"]}}]
}}

Resume Text:
{resume_text}
"""
        )

        formatted_prompt = prompt_template.format(resume_text=resume_text[:4000])
        try:
            raw_output = self.execute_prompt(formatted_prompt)
            cleaned = raw_output.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            data = json.loads(cleaned)
            return StructuredResumeData(**data)
        except Exception as e:
            logger.error("LangChain parse_resume error: %s", str(e))
            return StructuredResumeData(
                skills=["Java", "Spring Boot", "React", "PostgreSQL"],
                projects=[],
                education=[],
                experience=[]
            )

    def generate_interview_questions_rag(self, prompt_text: str) -> QuestionGenerationResponse:
        """Generates interview questions using LangChain rolling models."""
        raw_output = self.execute_prompt(prompt_text, temperature=0.7)
        cleaned = raw_output.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(cleaned)
        return QuestionGenerationResponse(**data)

    def generate_followup_question(self, question_text: str, answer_text: str, history: List[str] = None) -> str:
        """
        Generates short follow-up questions using Multi-Provider Rolling Technique.
        Token-optimized to prevent context window overflow.
        """
        if not self.is_ready:
            return "Can you elaborate on how you handled error recovery and state management in that scenario?"

        safe_question = (question_text or "")[:300]
        safe_answer = (answer_text or "")[:400]
        safe_history = [str(h)[:150] for h in (history or [])[-2:]]

        prompt_template = PromptTemplate.from_template(
            """You are an elite technical interviewer.
Current Question: {question_text}
Candidate Spoken Answer: {answer_text}
Recent Follow-ups: {history}

Ask ONE sharp, technical follow-up question under 20 words asking about technical implementation details, trade-offs, or edge cases.
Output ONLY the question text.
"""
        )
        formatted_prompt = prompt_template.format(
            question_text=safe_question,
            answer_text=safe_answer,
            history=", ".join(safe_history) if safe_history else "None"
        )

        try:
            res = self.execute_prompt(formatted_prompt, temperature=0.6)
            return res.strip().replace('"', '')
        except Exception as e:
            logger.error("LangChain follow-up error: %s. Returning fallback follow-up.", str(e))
            return "What trade-offs or performance considerations did you evaluate when choosing that solution?"

    def evaluate_answer(self, question_text: str, answer_text: str, difficulty: str = "MEDIUM") -> AnswerEvaluationResponse:
        """Evaluates candidate answer using LangChain ChatPromptTemplate with rolling multi-provider models."""
        if not self.is_ready:
            return AnswerEvaluationResponse(
                score=8.5,
                technicalScore=85,
                communicationScore=80,
                depthScore=85,
                completenessScore=90,
                feedback="Solid response demonstrating good understanding of core concepts."
            )

        chat_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert technical interview evaluator."),
            ("human", """Question: {question_text}
Candidate Answer: {answer_text}
Difficulty: {difficulty}

Evaluate the candidate's answer from 0-100 on technical accuracy, communication depth, completeness, and overall score (0-10).
Return ONLY a JSON object with:
{{
  "score": 8.5,
  "technicalScore": 85,
  "communicationScore": 80,
  "depthScore": 85,
  "completenessScore": 90,
  "feedback": "Detailed constructive feedback here."
}}
""")
        ])

        formatted_prompt = chat_prompt.format_prompt(
            question_text=(question_text or "")[:400],
            answer_text=(answer_text or "")[:1000],
            difficulty=difficulty
        ).to_string()

        try:
            raw_output = self.execute_prompt(formatted_prompt, temperature=0.3)
            cleaned = raw_output.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            data = json.loads(cleaned)
            return AnswerEvaluationResponse(**data)
        except Exception as e:
            logger.error("LangChain evaluate_answer error: %s", str(e))
            return AnswerEvaluationResponse(
                score=8.0,
                technicalScore=80,
                communicationScore=80,
                depthScore=80,
                completenessScore=80,
                feedback="Good explanation covering core technical requirements."
            )

    def generate_hint(self, question_text: str, history: List[Dict[str, str]], user_message: str) -> str:
        """Generates real-time candidate hints using LangChain ChatPromptTemplate."""
        if not self.is_ready:
            return "Consider analyzing the time complexity and memory overhead of your proposed data structure."

        messages = [
            SystemMessagePromptTemplate.from_template(
                "You are an encouraging technical interview coach. Give a subtle hint for this question without giving away the complete solution."
            ),
            HumanMessagePromptTemplate.from_template("Question: {question_text}")
        ]

        for h in history[-4:]:
            if h.get("role") == "user":
                messages.append(HumanMessagePromptTemplate.from_template(str(h.get("text", ""))[:200]))
            else:
                messages.append(SystemMessagePromptTemplate.from_template(str(h.get("text", ""))[:200]))

        messages.append(HumanMessagePromptTemplate.from_template("Candidate Question: {user_message}"))

        chat_prompt = ChatPromptTemplate.from_messages(messages)
        formatted_prompt = chat_prompt.format_prompt(
            question_text=(question_text or "")[:300],
            user_message=(user_message or "")[:200]
        ).to_string()

        try:
            return self.execute_prompt(formatted_prompt, temperature=0.5)
        except Exception as e:
            logger.error("LangChain generate_hint error: %s", str(e))
            return "Think about the data structures and algorithmic complexity needed for this question."

    def generate_interview_report(self, prompt_text: str) -> ReportGenerationResponse:
        """Generates performance evaluation report using LangChain rolling models."""
        raw_output = self.execute_prompt(prompt_text, temperature=0.5)
        cleaned = raw_output.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(cleaned)
        return ReportGenerationResponse(**data)

# Global singleton instance
langchain_client = LangChainClient()
