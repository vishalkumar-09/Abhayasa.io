import logging
import json
from app.core.settings import settings
from app.schemas.report import ReportGenerationRequest, ReportGenerationResponse
from app.llm.langchain_client import langchain_client

logger = logging.getLogger("app")

class ReportGeneratorService:
    def __init__(self):
        self.is_ready = True

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
            parsed_response = langchain_client.generate_interview_report(prompt)
            
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
        """Calculates raw overall score average and generates a dynamic evaluation report based on candidate performance."""
        answers = request.answers
        scores = [a.score for a in answers if a.score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0.0
        overall_score = round(float(avg_score), 2)

        # Check if they skipped/failed the interview
        non_blank_answers = [a for a in answers if a.answerText and a.answerText.strip() and a.score > 2]
        
        if len(non_blank_answers) == 0:
            summary = (
                "The candidate did not provide substantial answers to the questions in this interview session. "
                "No technical evaluation could be completed because of the missing or incomplete responses."
            )
            strengths = ["No technical strengths could be identified from the blank responses."]
            weaknesses = [
                "Failed to attempt the technical, scenario-based, and algorithm questions.",
                "Incomplete participation in the mock interview session."
            ]
            
            # Extract missing concepts from expected keywords of the questions
            missing_concepts = []
            for a in answers:
                if a.expectedKeywords:
                    missing_concepts.extend(a.expectedKeywords)
            missing_concepts = list(set(missing_concepts))[:6]
            if not missing_concepts:
                missing_concepts = ["System Design", "Core Technologies", "Problem Solving"]
                
            roadmap = [
                "Review the syllabus and technical prerequisites for the role.",
                "Attempt the mock interview again and provide written explanations for each question.",
                "Familiarize yourself with core concepts like API development, state management, and algorithms."
            ]
        else:
            # Sort answers by score
            answered_items = [a for a in answers if a.score is not None]
            answered_items.sort(key=lambda x: x.score, reverse=True)
            
            best_answers = [a for a in answered_items if a.score >= 7]
            worst_answers = [a for a in answered_items if a.score < 7]
            
            strengths = []
            for a in best_answers[:3]:
                topic = a.expectedKeywords[0] if a.expectedKeywords else "Technical Explanation"
                strengths.append(f"Strong understanding of '{topic}': {a.feedback}")
            if not strengths:
                strengths = ["Completed mock responses and demonstrated general technical interest."]
                
            weaknesses = []
            for a in worst_answers[:3]:
                topic = a.expectedKeywords[0] if a.expectedKeywords else "General Concepts"
                if a.score <= 2:
                    weaknesses.append(f"Candidate skipped or provided minimal answer for '{topic}': '{a.questionText}'")
                else:
                    weaknesses.append(f"Gaps identified in '{topic}': {a.feedback}")
            if not weaknesses:
                weaknesses = ["No major technical weaknesses identified in the provided answers."]
                
            # Collect missing concepts
            missing_concepts = []
            for a in worst_answers:
                if a.expectedKeywords:
                    missing_concepts.extend(a.expectedKeywords)
            missing_concepts = list(set(missing_concepts))[:5]
            if not missing_concepts:
                missing_concepts = ["System optimization", "Edge case coverage"]
                
            # Generate roadmap items
            roadmap = []
            for a in worst_answers[:3]:
                topic = a.expectedKeywords[0] if a.expectedKeywords else "General Concepts"
                if a.score <= 2:
                    roadmap.append(f"Study core definitions of '{topic}' and practice explaining: '{a.questionText}'")
                else:
                    roadmap.append(f"Deepen understanding of '{topic}' to resolve feedback: '{a.feedback}'")
            if not roadmap:
                roadmap = ["Keep practicing technical coding questions and mock interviews."]
                
            # Generate summary
            summary = (
                f"The candidate completed the mock interview with an overall average score of {overall_score}/10. "
                f"Strongest performance was observed in topics like {', '.join([a.expectedKeywords[0] if a.expectedKeywords else 'general concepts' for a in best_answers[:2]]) if best_answers else 'fundamental concepts'}, "
                f"while further study is recommended for areas such as {', '.join([a.expectedKeywords[0] if a.expectedKeywords else 'advanced implementations' for a in worst_answers[:2]]) if worst_answers else 'skipped questions'}."
            )

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
