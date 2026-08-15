import json
import logging
from typing import List

from app.core.settings import settings
from app.schemas.generator import QuestionGenerationRequest, QuestionGenerationResponse, GeneratedQuestionItem, FollowUpGenerationRequest, FollowUpGenerationResponse
from app.llm.langchain_client import langchain_client
from app.rag.retrieval import retrieval_service

logger = logging.getLogger("app")

class QuestionGeneratorService:
    def __init__(self):
        self.is_ready = True

    def generate_interview_questions(self, request: QuestionGenerationRequest) -> QuestionGenerationResponse:
        """Generates exactly 45 interview questions (20 Resume, 20 Technical, 3 DSA, 2 HR) based on RAG context."""
        
        # 1. RAG Context Lookup (Match Job Description keywords to Candidate Resume chunks in Qdrant)
        rag_context = ""
        if request.resume_id is not None:
            try:
                hits = retrieval_service.retrieve_context(
                    query=request.job_description_text,
                    limit=5,
                    resume_id=request.resume_id
                )
                if hits:
                    rag_context = "\n\n".join([f"Resume Segment: {hit['text']}" for hit in hits])
                    logger.info("RAG context successfully loaded from Qdrant: %d segments", len(hits))
            except Exception as e:
                logger.error("RAG context lookup failed: %s", str(e))

        # 2. Check if API key is valid, else fallback to mock questions
        interview_type = request.interview_type.upper() if request.interview_type else "TECHNICAL"

        # 2. Check if rolling LLM client is ready, else fallback to mock questions
        if not langchain_client.is_ready:
            logger.info("Rolling LLMs not ready. Returning mock questions list.")
            return self.get_mock_questions_response(
                request.difficulty, 
                request.resume_text, 
                request.job_description_text,
                request.job_title,
                request.company_name,
                interview_type
            )
 
        # 3. Assemble Prompt dynamically based on interview type
        if interview_type == "HR":
            prompt = f"""
            You are an expert HR manager. Generate an HR and behavioral interview question set.
            
            Difficulty level: {request.difficulty}
            Target Company Name: {request.company_name or 'the company'}
            Target Job Title: {request.job_title or 'the role'}
            
            Candidate Resume text (for cultural/background context):
            {request.resume_text}
            
            You MUST generate exactly 5 questions categorized as follows:
            - "HR" (5 questions): behavioral, situational, conflict resolution, communication, interest in joining {request.company_name or 'the company'}, and career path.
            
            Enforce that all questions match the {request.difficulty} difficulty level. Provide relevant expected_keywords for each question.
            """
        else:
            prompt = f"""
            You are an elite technical interviewer. Generate a technical interview question set tailored to the candidate's resume and target job description.
            
            Difficulty level required: {request.difficulty}
            
            Candidate Resume:
            {request.resume_text}
            
            {"Semantic RAG Resume Highlights (focus on these areas):" if rag_context else ""}
            {rag_context}
            
            Job Description Requirements:
            {request.job_description_text}
            
            You MUST generate exactly 10 questions categorized as follows:
            1. "DSA" (2 questions): Algorithms, data structures, complexity, and coding puzzles (e.g. arrays, strings, dynamic programming, linked lists, trees) matching the {request.difficulty} difficulty.
            2. "TECHNICAL" (4 questions): Evaluating core technologies, concepts, and architectural principles required for the job description.
            3. "RESUME" (4 questions): Specific technical questions probing the technical projects, achievements, technologies, and developer decisions mentioned in the resume.
            
            Enforce that all questions match the {request.difficulty} difficulty level. Provide relevant expected_keywords for each question.
            """
 
        try:
            return langchain_client.generate_interview_questions_rag(prompt)
 
        except Exception as e:
            logger.error("Error during Gemini question generation: %s. Falling back to mock questions.", str(e))
            return self.get_mock_questions_response(
                request.difficulty, 
                request.resume_text, 
                request.job_description_text,
                request.job_title,
                request.company_name,
                interview_type
            )
 
    def get_mock_questions_response(
        self, 
        difficulty: str, 
        resume_text: str, 
        jd_text: str, 
        job_title: str = None, 
        company_name: str = None,
        interview_type: str = "TECHNICAL"
    ) -> QuestionGenerationResponse:
        """Returns a dynamically generated fallback list of questions reflecting candidate skills, projects, and experiences based on interview type."""
        questions = []
        
        # Predefined common tech keywords to check
        known_techs = [
            "Java", "Spring Boot", "Python", "FastAPI", "Next.js", "React", "Angular", "Vue",
            "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "PostgreSQL", "MySQL",
            "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "GCP", "Git", "REST APIs", "GraphQL"
        ]
        
        # 1. Dynamic skills extraction
        from app.services.parser_service import extract_heuristic_skills
        candidate_skills = extract_heuristic_skills(resume_text)
        if not candidate_skills:
            candidate_skills = extract_heuristic_skills(jd_text)
        if not candidate_skills:
            candidate_skills = ["Software Architecture", "Problem Solving", "System Design", "Database Management"]
            
        job_skills = extract_heuristic_skills(jd_text)
        if not job_skills:
            job_skills = candidate_skills

        target_title = job_title if job_title else "Software Engineer"
        target_company = company_name if company_name else "the company"

        if interview_type == "HR":
            hr_questions = [
                ("Describe a time when you disagreed with a colleague on a technical decision. How did you resolve it?", ["disagreement", "resolution", "communication", "teamwork"]),
                ("Why are you interested in joining {company} as a {job_title}?", ["motivation", "career goals", "interest", target_company]),
                ("Tell me about a time you had to learn a new technology quickly to solve a problem.", ["learning", "adaptability", "quick learning"]),
                ("Where do you see yourself in five years professionally?", ["growth", "future goals", "career path"]),
                ("How do you handle working under tight deadlines and high-pressure scenarios?", ["stress management", "prioritization", "pressure"])
            ]
            for text, kw in hr_questions:
                questions.append(GeneratedQuestionItem(
                    question_text=text.format(company=target_company, job_title=target_title), 
                    category="HR", 
                    difficulty=difficulty, 
                    expected_keywords=kw
                ))
        else:
            # Formulate 4 Resume-specific questions dynamically using candidate's actual extracted skills
            resume_templates = [
                "In your projects utilizing {skill}, how did you design the system architecture for maintainability?",
                "What were the biggest performance or scaling challenges you encountered while implementing your {skill} features?",
                "When developing your application, why did you choose {skill} over alternative frameworks or tools?",
                "Can you describe a complex technical debugging challenge you faced while working with {skill} and how you fixed it?"
            ]
            for i in range(4):
                skill = candidate_skills[i % len(candidate_skills)]
                text = resume_templates[i].format(skill=skill)
                questions.append(GeneratedQuestionItem(
                    question_text=text, 
                    category="RESUME", 
                    difficulty=difficulty, 
                    expected_keywords=[skill, "architecture", "implementation"]
                ))
     
            # Formulate 4 Technical questions dynamically matching the target job description details
            tech_templates = [
                "As a {job_title} at {company}, what are the best practices for structuring a production-ready application using {skill}?",
                "How does concurrency and multi-threading work under the hood in {skill}?",
                "Explain how dependency injection or module management is handled in {skill}.",
                "What are the common memory leak patterns or bottlenecks in {skill} and how do you prevent them?",
                "How do you handle database connections or session lifecycles in {skill}?",
                "Explain the difference between synchronous and asynchronous operations in {skill}."
            ]
            for i in range(4):
                skill = job_skills[i % len(job_skills)]
                text = tech_templates[i % len(tech_templates)].format(
                    job_title=target_title, 
                    company=target_company, 
                    skill=skill
                )
                questions.append(GeneratedQuestionItem(
                    question_text=text,
                    category="TECHNICAL",
                    difficulty=difficulty,
                    expected_keywords=[skill, "architecture", "best practices"]
                ))
     
            # 2 DSA questions
            dsa_questions = [
                ("Explain how to find the longest substring without repeating characters. What is the time complexity?", ["longest substring", "sliding window", "hash set", "O(N)"]),
                ("How do you detect a cycle in a linked list? Describe Floyd's Cycle Finding algorithm.", ["linked list cycle", "Floyd's algorithm", "two pointers", "slow and fast"])
            ]
            for text, kw in dsa_questions:
                questions.append(GeneratedQuestionItem(question_text=text, category="DSA", difficulty=difficulty, expected_keywords=kw))
 
        return QuestionGenerationResponse(questions=questions)

    def generate_followup_fallback(self, request: FollowUpGenerationRequest) -> str:
        """Fallback method to scan answer text and question context to output domain-tailored contextual follow-up questions."""
        ans_text = request.answer_text.strip()
        ans_lower = ans_text.lower()
        q_lower = request.question_text.lower()

        if "don't know" in ans_lower or "dont know" in ans_lower or "no idea" in ans_lower or len(ans_lower) < 8:
            return "No problem. Let's pivot slightly: what core concepts or foundational principles would you consider when researching a solution for this?"

        # Extract domain context (HR vs Technical vs DSA)
        is_hr = any(k in q_lower for k in ["team", "conflict", "disagree", "challenge", "describe a time", "situation", "strength", "weakness", "leadership", "colleague", "role", "why do you", "company"])
        is_dsa = any(k in q_lower for k in ["algorithm", "array", "tree", "graph", "complexity", "dsa", "binary", "list", "sort", "search", "function", "write a", "implement"])

        # Extract candidate's key terms
        words = [w.strip(",.()?\"'!") for w in ans_text.split() if len(w.strip(",.()?\"'!")) > 3]
        stop_words = {
            "would", "about", "there", "their", "project", "using", "implement", "think", "which", 
            "because", "application", "first", "second", "also", "then", "have", "with", "from", 
            "that", "this", "some", "like", "when", "time", "just", "make", "made", "good", "well"
        }
        keywords = [w for w in words if w.lower() not in stop_words]

        subject = keywords[0] if keywords else "your approach"
        secondary = keywords[1] if len(keywords) > 1 else "the outcome"

        if is_hr:
            options = [
                f"Regarding '{subject}', what specific step did you personally take to keep the team aligned, and what did you learn from that experience?",
                f"You mentioned '{subject}'. How did you measure the impact of that resolution on {secondary}?",
                f"Looking back at how you handled '{subject}', is there anything you would do differently if faced with a similar challenge today?",
                f"How did you handle communication regarding '{subject}' to ensure all stakeholders were on the same page?"
            ]
        elif is_dsa:
            options = [
                f"What are the best-case and worst-case time and space complexities of your approach involving '{subject}'?",
                f"How would your algorithm for '{subject}' scale if the input data size grew to millions of elements?",
                f"What potential edge cases (such as null inputs or duplicate values) might break this '{subject}' logic, and how would you handle them?",
                f"Can you explain why you chose this specific pattern for '{subject}' instead of an alternative data structure?"
            ]
        else:
            # Technical / System Design
            options = [
                f"What key trade-offs or architectural considerations led you to choose '{subject}' for this scenario?",
                f"You mentioned '{subject}'. How would you handle error recovery, logging, or debugging if {secondary} fails in production?",
                f"In a high-throughput environment, what performance bottlenecks might arise with '{subject}', and how would you optimize it?",
                f"How do you ensure security and proper validation when configuring '{subject}'?"
            ]

        for opt in options:
            if opt not in (request.history or []):
                return opt
        return options[0]

    def generate_followup_question(self, request: FollowUpGenerationRequest) -> FollowUpGenerationResponse:
        """Generates a contextual follow-up question via LangChain Rolling LLMs."""
        try:
            followup_text = langchain_client.generate_followup_question(
                question_text=request.question_text,
                answer_text=request.answer_text,
                history=request.history
            )
            return FollowUpGenerationResponse(followupQuestion=followup_text)
        except Exception as e:
            logger.error("Error during LangChain follow-up generation: %s. Using local fallback.", str(e))
            fallback_text = self.generate_followup_fallback(request)
            return FollowUpGenerationResponse(followupQuestion=fallback_text)
 
# Singleton instance
question_generator_service = QuestionGeneratorService()
