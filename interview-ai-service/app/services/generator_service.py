import json
import logging
import google.generativeai as genai
from typing import List

from app.core.settings import settings
from app.schemas.generator import QuestionGenerationRequest, QuestionGenerationResponse, GeneratedQuestionItem
from app.rag.retrieval import retrieval_service

logger = logging.getLogger("app")

class QuestionGeneratorService:
    def __init__(self):
        try:
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            self.is_ready = True
        except Exception as e:
            logger.error("Failed to initialize GenerativeModel: %s", str(e))
            self.is_ready = False

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
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY" or not self.is_ready:
            logger.info("Gemini API not configured. Returning 45 mock questions list.")
            return self.get_mock_questions_response(request.difficulty, request.resume_text, request.job_description_text)
 
        # 3. Assemble Prompt
        prompt = f"""
        You are an elite technical interviewer. Generate an interview question set tailored to the candidate's resume and the target job description.
        
        Difficulty level required: {request.difficulty}
        
        Candidate Resume:
        {request.resume_text}
        
        {"Semantic RAG Resume Highlights (focus on these areas):" if rag_context else ""}
        {rag_context}
        
        Job Description Requirements:
        {request.job_description_text}
        
        You MUST generate exactly 45 questions categorized as follows:
        1. "RESUME" (20 questions): Specific questions probing the projects, achievements, and experiences mentioned in the resume. Focus on candidate ownership and technical decisions.
        2. "TECHNICAL" (20 questions): Questions evaluating core technologies, concepts, and architectural principles required for the job description.
        3. "DSA" (3 questions): Algorithms, complexity, and coding puzzles (e.g. structures, sorting, graphs, DP) matching the {request.difficulty} difficulty.
        4. "HR" (2 questions): Behavioral and situational questions (e.g., handling conflicts, teamwork, career goals).
 
        Enforce that all questions match the {request.difficulty} difficulty level. Provide relevant expected_keywords for each question.
        """
 
        try:
            generation_config = {
                "response_mime_type": "application/json",
                "response_schema": QuestionGenerationResponse
            }
 
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )
 
            data = json.loads(response.text)
            
            # Enforce validation
            parsed_response = QuestionGenerationResponse(**data)
            logger.info("Successfully generated %d questions using Gemini API.", len(parsed_response.questions))
            return parsed_response
 
        except Exception as e:
            logger.error("Error during Gemini question generation: %s. Falling back to mock questions.", str(e))
            return self.get_mock_questions_response(request.difficulty, request.resume_text, request.job_description_text)
 
    def get_mock_questions_response(self, difficulty: str, resume_text: str, jd_text: str) -> QuestionGenerationResponse:
        """Returns a dynamically generated fallback list of exactly 45 questions reflecting candidate skills."""
        questions = []
        
        # Predefined common tech keywords to check
        known_techs = [
            "Java", "Spring Boot", "Python", "FastAPI", "Next.js", "React", "Angular", "Vue",
            "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "PostgreSQL", "MySQL",
            "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "GCP", "Git", "REST APIs", "GraphQL"
        ]
        
        # Simple extraction
        resume_lower = resume_text.lower()
        candidate_skills = [t for t in known_techs if t.lower() in resume_lower]
        if not candidate_skills:
            candidate_skills = ["Java", "Spring Boot", "REST APIs", "SQL"]
            
        jd_lower = jd_text.lower()
        job_skills = [t for t in known_techs if t.lower() in jd_lower]
        if not job_skills:
            job_skills = ["Software Engineering", "System Design", "Databases"]
            
        # 20 Resume questions formulated dynamically
        resume_templates = [
            "How did you handle state management or configurations when working with {skill}?",
            "Can you describe a challenging bug you faced while working with {skill} and how you debugged it?",
            "In your resume, you mentioned experience with {skill}. What design patterns did you apply there?",
            "Why did you choose {skill} over alternative technologies for your projects?",
            "How did you optimize the performance or load times when integrating {skill}?",
            "Can you explain how you secured endpoints or data access in your {skill} implementations?",
            "How did you test your {skill} codebase to ensure high test coverage?",
            "What were the primary data persistence strategies you used with {skill}?",
            "Can you describe the system architecture of a project where you integrated {skill} and {prev_skill}?",
            "What was the most complex feature you built using {skill} and what was your ownership?"
        ]
        
        for i in range(20):
            skill = candidate_skills[i % len(candidate_skills)]
            prev_skill = candidate_skills[(i - 1) % len(candidate_skills)]
            text = resume_templates[i % len(resume_templates)].format(skill=skill, prev_skill=prev_skill)
            questions.append(GeneratedQuestionItem(
                question_text=text,
                category="RESUME",
                difficulty=difficulty,
                expected_keywords=[skill, "architecture", "debugging"]
            ))
 
        # 20 Technical questions formulated dynamically
        tech_templates = [
            "What are the best practices for structuring a production-ready application using {skill}?",
            "How does concurrency and multi-threading work under the hood in {skill}?",
            "Explain how dependency injection or module management is handled in {skill}.",
            "What are the common memory leak patterns or bottlenecks in {skill} and how do you prevent them?",
            "How do you handle database connections or session lifecycles in {skill}?",
            "Explain the difference between synchronous and asynchronous operations in {skill}.",
            "How do you implement error handling and logging in a {skill} application?",
            "Describe the difference between compilation and runtime execution in {skill}.",
            "How does {skill} ensure data integrity and validation for incoming client payloads?",
            "What are the major differences between the latest version of {skill} and its predecessors?"
        ]
        
        for i in range(20):
            skill = job_skills[i % len(job_skills)]
            text = tech_templates[i % len(tech_templates)].format(skill=skill)
            questions.append(GeneratedQuestionItem(
                question_text=text,
                category="TECHNICAL",
                difficulty=difficulty,
                expected_keywords=[skill, "best practices", "architecture"]
            ))
 
        # 3 DSA questions
        dsa_questions = [
            ("Explain how to find the longest substring without repeating characters. What is the time complexity?", ["longest substring", "sliding window", "hash set", "O(N)"]),
            ("How do you detect a cycle in a linked list? Describe Floyd's Cycle Finding algorithm.", ["linked list cycle", "Floyd's algorithm", "two pointers", "slow and fast"]),
            ("Given a binary tree, how do you find its maximum depth recursively?", ["binary tree", "maximum depth", "recursion", "DFS"])
        ]
        for text, kw in dsa_questions:
            questions.append(GeneratedQuestionItem(question_text=text, category="DSA", difficulty=difficulty, expected_keywords=kw))
 
        # 2 HR questions
        hr_questions = [
            ("Describe a time when you disagreed with a colleague on a technical decision. How did you resolve it?", ["disagreement", "resolution", "communication", "teamwork"]),
            ("Why are you interested in joining InterviewForge and what do you hope to accomplish here?", ["motivation", "career goals", "interest"])
        ]
        for text, kw in hr_questions:
            questions.append(GeneratedQuestionItem(question_text=text, category="HR", difficulty=difficulty, expected_keywords=kw))
 
        return QuestionGenerationResponse(questions=questions)
 
# Singleton instance
question_generator_service = QuestionGeneratorService()
