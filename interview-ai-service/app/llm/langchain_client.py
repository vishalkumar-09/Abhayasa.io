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
        "gemini-flash-lite-latest",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
        "gemini-pro-latest"
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
        """Generates interview questions using LangChain rolling models with JSON validation."""
        # Use temperature=0.6 for creative but focused questions
        # Use max_tokens=4000 to allow full 15-18 question set
        raw_output = self.execute_prompt(prompt_text, temperature=0.6, max_tokens=4000)
        data = extract_json_payload(raw_output)
        if isinstance(data, list):
            data = {"questions": data}
        # Validate each question has required fields
        questions = data.get("questions", [])
        validated = []
        for q in questions:
            if q.get("question_text") and len(q.get("question_text", "")) > 10:
                validated.append(q)
        data["questions"] = validated
        return QuestionGenerationResponse(**data)

    def generate_followup_question(self, question_text: str, answer_text: str, history: List[str] = None, candidate_state: dict = None) -> str:
        """Generates adaptive follow-up using candidate state for difficulty adjustment."""
        from app.llm.prompts import ADAPTIVE_FOLLOWUP_PROMPT
        safe_question = (question_text or "")[:400]
        safe_answer = (answer_text or "")[:600]
        safe_history = "\n".join(history or [])[:300]
        import json
        state_json = json.dumps(candidate_state or {"rollingAvgScore": 7.0, "currentDifficulty": "MID"})
        follow_up_number = len(history) + 1 if history else 1
        
        formatted = ADAPTIVE_FOLLOWUP_PROMPT.format(
            question_text=safe_question,
            answer_text=safe_answer,
            history=safe_history if safe_history else "None",
            candidate_state=state_json,
            follow_up_number=follow_up_number
        )
        try:
            res = self.execute_prompt(formatted, temperature=0.7, max_tokens=60)
            cleaned = res.strip().replace('"', '')
            # Ensure it's not empty and not identical to any previous follow-up in history
            if cleaned and len(cleaned) > 10 and not any(cleaned.lower() == h.lower() for h in (history or [])):
                return cleaned
            return self._fallback_followup(safe_question, safe_answer, history, candidate_state)
        except Exception as e:
            logger.error("Follow-up generation error: %s", str(e))
            return self._fallback_followup(safe_question, safe_answer, history, candidate_state)

    def _fallback_followup(self, question_text: str, answer_text: str, history: List[str] = None, candidate_state: dict = None) -> str:
        """Dynamic heuristic fallback that extracts candidate's exact spoken points and avoids repeating previous questions."""
        from app.services.generator_service import question_generator_service
        from app.schemas.generator import FollowUpGenerationRequest
        req = FollowUpGenerationRequest(
            question_text=question_text,
            answer_text=answer_text,
            history=history or []
        )
        return question_generator_service.generate_followup_fallback(req)

    def evaluate_answer_with_evidence(self, question_text: str, answer_text: str, expected_keywords: List[str] = None, difficulty: str = "MEDIUM") -> AnswerEvaluationResponse:
        """Evidence-aware evaluation returning verbatim evidence quotes and missed concepts."""
        from app.llm.prompts import EVIDENCE_EVALUATOR_PROMPT
        
        # Detect blank/very short answers early
        if not answer_text or len(answer_text.strip()) < 10:
            return AnswerEvaluationResponse(
                score=0, technicalScore=0, communicationScore=0, depthScore=0, completenessScore=0,
                feedback="No answer provided.",
                evidenceQuote=None,
                missedConcepts=expected_keywords or [],
                answerStrength="BLANK"
            )
        
        formatted = EVIDENCE_EVALUATOR_PROMPT.format(
            question_text=(question_text or "")[:500],
            answer_text=(answer_text or "")[:1200],
            expected_keywords=", ".join(expected_keywords or []),
            difficulty=difficulty
        )
        try:
            raw_output = self.execute_prompt(formatted, temperature=0.2, max_tokens=350)
            data = extract_json_payload(raw_output)
            # Clamp scores to 0-100 for sub-scores, 0-10 for overall
            data["score"] = max(0, min(10, int(data.get("score", 5))))
            data["technicalScore"] = max(0, min(100, int(data.get("technicalScore", 50))))
            data["communicationScore"] = max(0, min(100, int(data.get("communicationScore", 50))))
            data["depthScore"] = max(0, min(100, int(data.get("depthScore", 50))))
            data["completenessScore"] = max(0, min(100, int(data.get("completenessScore", 50))))
            # Derive answerStrength if not provided
            if "answerStrength" not in data:
                s = data["score"]
                data["answerStrength"] = "STRONG" if s > 7 else ("PARTIAL" if s >= 4 else "WEAK")
            return AnswerEvaluationResponse(**data)
        except Exception as e:
            logger.error("Evidence evaluation error: %s", str(e))
            return self._fallback_evaluation(answer_text, expected_keywords or [])

    def _fallback_evaluation(self, answer_text: str, expected_keywords: List[str]) -> AnswerEvaluationResponse:
        """Local heuristic evaluation fallback."""
        matched = sum(1 for kw in expected_keywords if kw.lower() in answer_text.lower())
        total = max(len(expected_keywords), 1)
        ratio = matched / total
        score = int(3 + (ratio * 7))
        strength = "STRONG" if score > 7 else ("PARTIAL" if score >= 4 else "WEAK")
        missed = [kw for kw in expected_keywords if kw.lower() not in answer_text.lower()]
        return AnswerEvaluationResponse(
            score=score, technicalScore=score*10, communicationScore=70, depthScore=score*9, completenessScore=int(ratio*100),
            feedback=f"Answer covered {matched}/{total} expected concepts. Review: {', '.join(missed[:3])}" if missed else "Good coverage of expected concepts.",
            evidenceQuote=None,
            missedConcepts=missed[:5],
            answerStrength=strength
        )

    def evaluate_answer(self, question_text: str, answer_text: str, difficulty: str = "MEDIUM") -> AnswerEvaluationResponse:
        """Alias for evaluate_answer_with_evidence for backward compatibility."""
        return self.evaluate_answer_with_evidence(question_text, answer_text, [], difficulty)

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
        """Generates structured report with competency breakdown using LangChain rolling models."""
        raw_output = self.execute_prompt(prompt_text, temperature=0.4, max_tokens=2000)
        data = extract_json_payload(raw_output)
        # Ensure all required fields present with defaults
        data.setdefault("overallScore", 5.0)
        data.setdefault("summary", "Interview completed.")
        data.setdefault("strengths", [])
        data.setdefault("weaknesses", [])
        data.setdefault("missingConcepts", [])
        data.setdefault("improvementRoadmap", [])
        data.setdefault("recommendations", "")
        data.setdefault("readiness", "NEEDS_IMPROVEMENT")
        data.setdefault("readinessScore", 50)
        data.setdefault("competencyBreakdown", [])
        data.setdefault("roleAlignment", {})
        data.setdefault("nextInterviewPlan", [])
        return ReportGenerationResponse(**data)

    def transcribe_audio_bytes(self, audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
        """Transcribes raw recorded audio bytes using Gemini Multimodal Audio or Groq Whisper API."""
        if not audio_bytes or len(audio_bytes) < 50:
            return ""

        # 1. Try Gemini Multimodal Audio API
        for key in self.gemini_keys:
            try:
                from google import genai
                from google.genai import types
                client = genai.Client(api_key=key)
                
                audio_part = types.Part.from_bytes(
                    data=audio_bytes,
                    mime_type=mime_type or "audio/webm"
                )
                prompt = "Transcribe the spoken speech in this audio file verbatim into clean English text. Output ONLY the transcribed spoken text without any extra notes, commentary, or markdown formatting."
                
                try:
                    response = client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=[audio_part, prompt]
                    )
                    if response.text and response.text.strip():
                        logger.info("Successfully transcribed audio via Gemini 2.5 Flash (%d bytes)", len(audio_bytes))
                        return response.text.strip()
                except Exception as model_err:
                    logger.warning("Gemini 2.5 Flash audio transcription failed: %s", str(model_err))
            except Exception as key_err:
                logger.warning("Gemini key transcription failed: %s. Trying Groq Whisper...", str(key_err))

        # 2. Try Groq Whisper API (whisper-large-v3-turbo / whisper-large-v3)
        groq_whisper_models = ["whisper-large-v3-turbo", "whisper-large-v3"]
        for key in self.groq_keys:
            for w_model in groq_whisper_models:
                try:
                    import httpx
                    headers = {"Authorization": f"Bearer {key}"}
                    files = {"file": ("speech.webm", audio_bytes, mime_type or "audio/webm")}
                    data = {"model": w_model, "language": "en"}
                    
                    with httpx.Client(timeout=15.0) as client:
                        resp = client.post("https://api.groq.com/openai/v1/audio/transcriptions", headers=headers, files=files, data=data)
                        if resp.status_code == 200:
                            result = resp.json()
                            text = result.get("text", "").strip()
                            if text:
                                logger.info("Successfully transcribed audio via Groq Whisper %s (%d bytes)", w_model, len(audio_bytes))
                                return text
                        else:
                            logger.warning("Groq Whisper %s returned HTTP %d: %s", w_model, resp.status_code, resp.text)
                except Exception as e:
                    logger.warning("Groq Whisper %s failed: %s", w_model, str(e))

        return ""

# Global singleton instance
langchain_client = LangChainClient()
