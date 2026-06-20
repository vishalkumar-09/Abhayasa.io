import logging
import json
import google.generativeai as genai
from app.core.settings import settings
from app.schemas.report import ReportGenerationRequest, ReportGenerationResponse

logger = logging.getLogger("app")

class ReportGeneratorService:
    def __init__(self):
        try:
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            self.is_ready = True
        except Exception as e:
            logger.error("Failed to initialize GenerativeModel: %s", str(e))
            self.is_ready = False

    def generate_interview_report(self, request: ReportGenerationRequest) -> ReportGenerationResponse:
        """Aggregates all mock interview QA pairs and generates a detailed performance report via Gemini API."""
        
        # Check if API key is configured, else fallback to mock report
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY" or not self.is_ready:
            logger.info("Gemini API not configured. Returning mock evaluation report.")
            return self.get_mock_report(request)

        # Build prompt containing all QA pairs
        qa_summary_parts = []
        for idx, ans in enumerate(request.answers):
            qa_summary_parts.append(
                f"Question {idx+1}: {ans.questionText}\n"
                f"Candidate Answer: {ans.answerText}\n"
                f"Keywords Expected: {', '.join(ans.expectedKeywords) if ans.expectedKeywords else 'None'}\n"
                f"Score Awarded: {ans.score}/10\n"
                f"Feedback: {ans.feedback}\n"
            )
        qa_data_text = "\n---\n".join(qa_summary_parts)

        prompt = f"""
        You are a principal technical hiring manager and career coach. Review the following mock interview transcript containing questions, candidate answers, and individual answer scores:
        
        {qa_data_text}
        
        Generate a comprehensive, high-quality, professional evaluation report for the candidate.
        Calculate the overall score between 0.0 and 10.0 based on the average or weighted performance across all questions.
        Identify key technical strengths, areas of improvement (weaknesses), technical concepts that the candidate missed, and outline a step-by-step learning roadmap.
        """

        try:
            # Enforce structured JSON schemas
            generation_config = {
                "response_mime_type": "application/json",
                "response_schema": ReportGenerationResponse
            }

            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )

            data = json.loads(response.text)
            parsed_response = ReportGenerationResponse(**data)
            
            # Populate consolidated recommendations string for Spring Boot compatibility
            if not parsed_response.recommendations:
                roadmap_str = "\n".join([f"- {item}" for item in parsed_response.improvementRoadmap])
                concepts_str = ", ".join(parsed_response.missingConcepts)
                parsed_response.recommendations = f"Missing Concepts: {concepts_str}\n\nActionable Roadmap:\n{roadmap_str}"
                
            logger.info("Successfully generated final report with overall score: %.2f", parsed_response.overallScore)
            return parsed_response

        except Exception as e:
            logger.error("Error during Gemini report generation: %s. Falling back to mock report.", str(e))
            return self.get_mock_report(request)

    def get_mock_report(self, request: ReportGenerationRequest) -> ReportGenerationResponse:
        """Calculates raw overall score average and maps standard stubs for standalone runs."""
        scores = [a.score for a in request.answers if a.score is not None]
        avg_score = sum(scores) / len(scores) if scores else 6.5
        overall_score = round(float(avg_score), 2)

        summary = (
            "The candidate demonstrated solid fundamental programming skills, particularly in database configurations "
            "and basic REST API design. However, explanations regarding system architecture details and concurrency control "
            "mechanisms were incomplete."
        )
        strengths = [
            "Good knowledge of relational database indexing and JPA mapping syntax.",
            "Strong articulation of REST principles and HTTP status code mappings.",
            "Demonstrated clear communication style and professional delivery."
        ]
        weaknesses = [
            "Limited explanation of spring security filters and JWT validation interceptors.",
            "Incomplete discussion regarding caching mechanisms and ORM lazy loading bottlenecks."
        ]
        missing_concepts = [
            "Spring Security Filter Chain lifecycle",
            "JPA transaction isolation levels",
            "Next.js state management hydration edge-cases"
        ]
        roadmap = [
            "Review Spring Security request filtering filters and trace JWT interceptors.",
            "Study database transaction isolations (optimistic vs pessimistic locking in JPA).",
            "Practice algorithmic sliding window coding puzzles on strings and arrays."
        ]

        roadmap_str = "\n".join([f"- {item}" for item in roadmap])
        concepts_str = ", ".join(missing_concepts)
        recommendations = f"Missing Concepts: {concepts_str}\n\nActionable Roadmap:\n{roadmap_str}"

        return ReportGenerationResponse(
            overallScore=overall_score,
            summary=summary,
            strengths=strengths,
            weaknesses=weaknesses,
            missingConcepts=missing_concepts,
            improvementRoadmap=roadmap,
            recommendations=recommendations
        )

# Singleton instance
report_generator_service = ReportGeneratorService()
