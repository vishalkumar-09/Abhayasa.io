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
        """Generates a blueprint-driven pool of 15-18 questions."""
        from app.services.interview_blueprint import blueprint_service
        from app.llm.prompts import BLUEPRINT_QUESTION_PROMPT
        
        interview_type = (request.interview_type or "TECHNICAL").upper()
        difficulty = (request.difficulty or "MID").upper()
        
        # 1. Create interview blueprint
        bp = blueprint_service.create_blueprint(
            job_title=request.job_title or "Software Engineer",
            jd_text=request.job_description_text or "",
            difficulty=difficulty,
            interview_type=interview_type
        )
        
        # 2. Extract structured resume data
        resume_structured = request.resume_structured or {}
        projects = resume_structured.get("projects", [])
        experience = resume_structured.get("experience", [])
        skills = resume_structured.get("skills", [])
        
        # Format project details for the prompt
        project_bullets = []
        for p in projects[:5]:  # limit to 5 projects
            title = p.get("title", p.get("name", "Project"))
            tech = p.get("technologies", p.get("techStack", []))
            desc = p.get("description", "")
            if isinstance(tech, list):
                tech = ", ".join(tech[:6])
            project_bullets.append(f"- {title}: {tech}. {str(desc)[:200]}")
        resume_projects_text = "\n".join(project_bullets) if project_bullets else "No projects listed."
        
        # Format experience
        exp_bullets = []
        for e in experience[:3]:
            role = e.get("role", e.get("title", "Role"))
            company = e.get("company", "Company")
            duration = e.get("duration", "")
            exp_bullets.append(f"- {role} at {company} ({duration})")
        resume_exp_text = "\n".join(exp_bullets) if exp_bullets else "No experience listed."
        
        # 3. Format blueprint for prompt
        competency_blueprint_text = "\n".join([
            f"- {c.name}: {c.question_count} questions ({int(c.weight*100)}% weight)"
            for c in bp.competencies
        ])
        
        # 4. Format previous questions for anti-repetition
        prev_q_text = "\n".join([f"- {q}" for q in (request.previous_questions or [])[:20]])
        
        # 5. RAG context (if available)
        rag_context = ""
        if request.resume_id is not None:
            try:
                hits = retrieval_service.retrieve_context(
                    query=request.job_description_text,
                    limit=4,
                    resume_id=request.resume_id
                )
                if hits:
                    rag_context = "\n".join([f"Resume Segment: {hit['text'][:200]}" for hit in hits])
            except Exception as e:
                logger.error("RAG lookup failed: %s", str(e))
        
        # 6. Check if LLM is ready
        if not langchain_client.is_ready:
            return self.get_mock_questions_response(
                difficulty, request.resume_text, request.job_description_text,
                request.job_title, request.company_name, interview_type
            )
        
        # 7. Build prompt
        prompt = BLUEPRINT_QUESTION_PROMPT.format(
            job_title=request.job_title or "Software Engineer",
            company_name=request.company_name or "the target company",
            interview_type=interview_type,
            difficulty=difficulty,
            competency_blueprint=competency_blueprint_text,
            resume_projects=resume_projects_text,
            resume_experience=resume_exp_text,
            resume_skills=", ".join(skills[:20]) if skills else "Not specified",
            jd_requirements=(request.job_description_text or "")[:1500],
            previous_questions=prev_q_text if prev_q_text else "None",
            question_count=bp.total_questions,
            rag_context=f"\n\nRelevant Resume Context (from semantic search):\n{rag_context}" if rag_context else ""
        )
        
        try:
            result = langchain_client.generate_interview_questions_rag(prompt)
            
            # Validate minimum question count
            if len(result.questions) < 8:
                logger.warning("LLM returned only %d questions, falling back.", len(result.questions))
                return self.get_mock_questions_response(
                    difficulty, request.resume_text, request.job_description_text,
                    request.job_title, request.company_name, interview_type
                )
            
            # Anti-repetition: remove questions too similar to previous
            prev_lower = [q.lower() for q in (request.previous_questions or [])]
            filtered = []
            for q in result.questions:
                q_lower = q.question_text.lower()
                is_duplicate = any(
                    len(set(q_lower.split()) & set(p.split())) / max(len(q_lower.split()), 1) > 0.6
                    for p in prev_lower
                )
                if not is_duplicate:
                    filtered.append(q)
            result.questions = filtered if len(filtered) >= 8 else result.questions
            
            logger.info("Generated %d blueprint-driven questions for %s role.", len(result.questions), bp.role_type)
            return result
            
        except Exception as e:
            logger.error("Blueprint question generation failed: %s. Falling back to mock.", str(e))
            return self.get_mock_questions_response(
                difficulty, request.resume_text, request.job_description_text,
                request.job_title, request.company_name, interview_type
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
        try:
            followup_text = langchain_client.generate_followup_question(
                question_text=request.question_text,
                answer_text=request.answer_text,
                history=request.history,
                candidate_state=getattr(request, 'candidate_state', None)
            )
            return FollowUpGenerationResponse(followupQuestion=followup_text)
        except Exception as e:
            logger.error("Follow-up generation error: %s. Using fallback.", str(e))
            fallback = self.generate_followup_fallback(request)
            return FollowUpGenerationResponse(followupQuestion=fallback)
 
# Singleton instance
question_generator_service = QuestionGeneratorService()
