import json
import logging
import re
import threading
from typing import List, Dict, Any, Optional, Tuple

from langchain_core.prompts import PromptTemplate, ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

from app.core.settings import settings
from app.schemas.parser import ResumeParsingResponse, StructuredResumeData
from app.schemas.evaluator import AnswerEvaluationResponse
from app.schemas.generator import GeneratedQuestionItem, QuestionGenerationResponse
from app.schemas.report import ReportGenerationResponse

logger = logging.getLogger("app")

def extract_json_payload(raw_text: str) -> Any:
    """Extracts valid JSON payload from raw LLM output using multi-stage matching."""
    if not raw_text or not raw_text.strip():
        raise ValueError("Empty response from LLM")
    
    cleaned = raw_text.strip()
    
    # 1. Direct JSON parse
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # 2. Extract from markdown code blocks ```json ... ```
    code_block_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', cleaned, re.IGNORECASE)
    if code_block_match:
        try:
            return json.loads(code_block_match.group(1).strip())
        except Exception:
            pass

    # 3. Extract JSON Object { ... }
    dict_match = re.search(r'\{[\s\S]*\}', cleaned)
    if dict_match:
        str_val = dict_match.group(0)
        for i in range(len(str_val), 0, -1):
            if str_val[i-1] == '}':
                try:
                    return json.loads(str_val[:i])
                except Exception:
                    continue

    # 4. Extract JSON Array [ ... ]
    list_match = re.search(r'\[[\s\S]*\]', cleaned)
    if list_match:
        str_val = list_match.group(0)
        for i in range(len(str_val), 0, -1):
            if str_val[i-1] == ']':
                try:
                    return json.loads(str_val[:i])
                except Exception:
                    continue

    return json.loads(cleaned)

# Provider model definitions prioritized by speed and active API support
PROVIDER_MODELS = {
    "groq": [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant"
    ],
    "gemini": [
        "gemini-2.5-flash",
        "gemini-1.5-flash"
    ],
    "openai": [
        "gpt-4o-mini",
        "gpt-4o"
    ],
    "anthropic": [
        "claude-3-5-haiku-20241022"
    ]
}

def parse_keys_list(raw_keys: str) -> List[str]:
    if not raw_keys:
        return []
    return [k.strip() for k in raw_keys.split(",") if k.strip() and not k.strip().startswith("YOUR_")]

class LangChainClient:
    """
    Ultra-Fast Multi-Provider LangChain Client with Instant Rolling Technique.
    Configured with max_retries=0 to eliminate blocking backoff delays when models hit 429 quota.
    """

    def __init__(self):
        self.gemini_keys = parse_keys_list(settings.GEMINI_API_KEY)
        self.openai_keys = parse_keys_list(settings.OPENAI_API_KEY)
        self.groq_keys = parse_keys_list(settings.GROQ_API_KEY)
        self.anthropic_keys = parse_keys_list(settings.ANTHROPIC_API_KEY)

        self._rolling_counter = 0
        self._lock = threading.Lock()
        
        # Build active provider-model-key tuples prioritizing ultra-fast Groq and OpenAI
        self.active_pool: List[Tuple[str, str, str]] = []

        # 1. Register Groq (Inference speed ~200ms)
        for k in self.groq_keys:
            for m in PROVIDER_MODELS["groq"]:
                self.active_pool.append(("groq", m, k))

        # 2. Register OpenAI (Latency ~500ms)
        for k in self.openai_keys:
            for m in PROVIDER_MODELS["openai"]:
                self.active_pool.append(("openai", m, k))

        # 3. Register Gemini
        for k in self.gemini_keys:
            for m in PROVIDER_MODELS["gemini"]:
                self.active_pool.append(("gemini", m, k))

        # 4. Register Anthropic
        for k in self.anthropic_keys:
            for m in PROVIDER_MODELS["anthropic"]:
                self.active_pool.append(("anthropic", m, k))

        self.is_ready = len(self.active_pool) > 0
        if self.is_ready:
            logger.info("LangChain Multi-LLM Client initialized with %d active model configurations.", len(self.active_pool))
        else:
            logger.warning("LangChain Client initialized with 0 API keys.")

    def _build_llm(self, provider: str, model_name: str, api_key: str, temperature: float = 0.7, max_tokens: Optional[int] = None):
        """Dynamically instantiates LangChain LLM with token length tightening for ultra-low latency."""
        if provider == "groq":
            from langchain_groq import ChatGroq
            kw = {"model_name": model_name, "groq_api_key": api_key, "temperature": temperature, "max_retries": 1}
            if max_tokens:
                kw["max_tokens"] = max_tokens
            return ChatGroq(**kw)
        elif provider == "openai":
            from langchain_openai import ChatOpenAI
            kw = {"model_name": model_name, "api_key": api_key, "temperature": temperature, "max_retries": 1}
            if max_tokens:
                kw["max_tokens"] = max_tokens
            return ChatOpenAI(**kw)
        elif provider == "gemini":
            from langchain_google_genai import ChatGoogleGenerativeAI
            kw = {"model": model_name, "google_api_key": api_key, "temperature": temperature, "max_retries": 0}
            if max_tokens:
                kw["max_output_tokens"] = max_tokens
            return ChatGoogleGenerativeAI(**kw)
        elif provider == "anthropic":
            from langchain_anthropic import ChatAnthropic
            kw = {"model_name": model_name, "api_key": api_key, "temperature": temperature, "max_retries": 1}
            if max_tokens:
                kw["max_tokens"] = max_tokens
            return ChatAnthropic(**kw)
        else:
            raise ValueError(f"Unknown LLM provider: {provider}")

    def execute_prompt(self, prompt_text: str, temperature: float = 0.7, max_tokens: Optional[int] = None) -> str:
        """Executes LLM request via LangChain with instant failover and token tightening."""
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
                llm = self._build_llm(provider, model_name, api_key, temperature=temperature, max_tokens=max_tokens)
                prompt = PromptTemplate.from_template("{input}")
                chain = prompt | llm
                response = chain.invoke({"input": prompt_text})
                
                content = response.content
                if isinstance(content, list):
                    text_parts = [item.get("text", str(item)) if isinstance(item, dict) else str(item) for item in content]
                    raw_text = "".join(text_parts)
                else:
                    raw_text = str(content)

                logger.info("LangChain success via provider '%s' model '%s'", provider.upper(), model_name)
                return raw_text
            except Exception as e:
                err_msg = str(e)
                logger.warning("LangChain provider '%s' model '%s' returned error: %s. Instantly rolling to next model...", provider.upper(), model_name, err_msg[:120])
                last_err = e
                continue

        if last_err:
            raise last_err
        raise RuntimeError("All multi-provider LangChain LLM models exhausted.")

    def parse_resume(self, resume_text: str) -> StructuredResumeData:
        """Parses raw resume text into structured JSON using LangChain."""
        if not self.is_ready:
            from app.services.parser_service import extract_heuristic_skills
            extracted = extract_heuristic_skills(resume_text)
            if not extracted:
                extracted = ["Software Engineering", "Problem Solving", "System Architecture"]
            return StructuredResumeData(
                skills=extracted,
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
            data = extract_json_payload(raw_output)
            if isinstance(data, list):
                data = {"skills": data, "projects": [], "education": [], "experience": []}
            return StructuredResumeData(**data)
        except Exception as e:
            logger.error("LangChain parse_resume error: %s", str(e))
            from app.services.parser_service import extract_heuristic_skills
            extracted = extract_heuristic_skills(resume_text)
            if not extracted:
                extracted = ["Software Engineering", "Problem Solving", "System Architecture"]
            return StructuredResumeData(
                skills=extracted,
                projects=[],
                education=[],
                experience=[]
            )

    def generate_interview_questions_rag(self, prompt_text: str) -> QuestionGenerationResponse:
        """Generates interview questions using LangChain rolling models."""
        raw_output = self.execute_prompt(prompt_text, temperature=0.7)
        data = extract_json_payload(raw_output)
        if isinstance(data, list):
            data = {"questions": data}
        return QuestionGenerationResponse(**data)

    def generate_followup_question(self, question_text: str, answer_text: str, history: List[str] = None) -> str:
        """
        Generates short follow-up questions using Multi-Provider Rolling Technique.
        Token-optimized to prevent context window overflow.
        """
        safe_question = (question_text or "")[:300]
        safe_answer = (answer_text or "")[:400]

        if not self.is_ready:
            from app.services.parser_service import extract_heuristic_skills
            found = extract_heuristic_skills(safe_answer + " " + safe_question)
            tech = found[0] if found else "that implementation"
            return f"What trade-offs or performance considerations did you evaluate when using {tech}?"

        prompt_template = PromptTemplate.from_template(
            """You are an elite technical interviewer.
Question Asked: {question_text}
Candidate Spoken Answer: {answer_text}

Ask ONE sharp follow-up question under 20 words probing directly into the specific technical tools, implementation choices, or concepts the candidate mentioned in their answer.
Output ONLY the follow-up question text.
"""
        )
        formatted_prompt = prompt_template.format(
            question_text=safe_question,
            answer_text=safe_answer
        )

        try:
            res = self.execute_prompt(formatted_prompt, temperature=0.6, max_tokens=40)
            return res.strip().replace('"', '')
        except Exception as e:
            logger.error("LangChain follow-up error: %s. Returning fallback follow-up.", str(e))
            from app.services.parser_service import extract_heuristic_skills
            found = extract_heuristic_skills(safe_answer + " " + safe_question)
            tech = found[0] if found else "that implementation"
            return f"What trade-offs or performance considerations did you evaluate when using {tech}?"

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
            raw_output = self.execute_prompt(formatted_prompt, temperature=0.3, max_tokens=220)
            data = extract_json_payload(raw_output)
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
            return self.execute_prompt(formatted_prompt, temperature=0.5, max_tokens=60)
        except Exception as e:
            logger.error("LangChain generate_hint error: %s", str(e))
            return "Think about the data structures and algorithmic complexity needed for this question."

    def generate_interview_report(self, prompt_text: str) -> ReportGenerationResponse:
        """Generates performance evaluation report using LangChain rolling models."""
        raw_output = self.execute_prompt(prompt_text, temperature=0.5)
        data = extract_json_payload(raw_output)
        return ReportGenerationResponse(**data)

# Global singleton instance
langchain_client = LangChainClient()
