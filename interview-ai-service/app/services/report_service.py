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
        from app.llm.prompts import STRUCTURED_REPORT_PROMPT
        
        if not langchain_client.is_ready:
            return self.get_mock_report(request)
        
        # 1. Compute competency-level scores from answer data
        competency_scores = self._compute_competency_scores(request)
        competency_summary = "\n".join([
            f"- {name}: avg score {data['avg']:.1f}/10, {data['count']} questions"
            for name, data in competency_scores.items()
        ])
        
        # 2. Compute overall score (normalize from 0-10 scale to 0-100 scale)
        all_scores = [a.score for a in request.answers if a.score is not None]
        raw_avg = (sum(all_scores) / len(all_scores)) if all_scores else 0.0
        overall_score = round(raw_avg * 10.0, 1) if raw_avg <= 10.0 else round(raw_avg, 1)
        
        # 3. Build QA transcript
        qa_parts = []
        for i, ans in enumerate(request.answers):
            qa_parts.append(
                f"Q{i+1} [{getattr(ans, 'category', 'TECHNICAL')}]: {ans.questionText}\n"
                f"Answer: {ans.answerText[:400]}\n"
                f"Score: {ans.score}/10 | Feedback: {ans.feedback[:200]}"
            )
        qa_transcript = "\n---\n".join(qa_parts)
        
        # 4. Role alignment
        resume_skills = set(s.lower() for s in (request.resume_skills or []))
        jd_skills = set(kw.lower() for ans in request.answers for kw in (ans.expectedKeywords or []))
        matched_skills = [s for s in resume_skills if any(s in jd.lower() or jd in s for jd in jd_skills)]
        
        prompt = STRUCTURED_REPORT_PROMPT.format(
            job_title=request.job_title or "Software Engineer",
            company_name=request.company_name or "Target Role",
            interview_type=request.interview_type or "TECHNICAL",
            difficulty=request.difficulty or "MID",
            resume_skills=", ".join((request.resume_skills or [])[:20]),
            qa_transcript=qa_transcript[:6000],
            competency_summary=competency_summary,
            overall_score=overall_score
        )
        
        try:
            parsed = langchain_client.generate_interview_report(prompt)
            
            # Ensure overallScore is on 0-100 scale
            parsed.overallScore = overall_score
            
            # Normalize competencyBreakdown scores to 0-100 scale
            if parsed.competencyBreakdown:
                for comp in parsed.competencyBreakdown:
                    if isinstance(comp, dict) and "score" in comp:
                        s = comp["score"]
                        if isinstance(s, (int, float)) and s <= 10:
                            comp["score"] = int(s * 10)
            else:
                parsed.competencyBreakdown = [
                    {
                        "name": name, 
                        "score": int(data["avg"] * 10) if data["avg"] <= 10 else int(data["avg"]), 
                        "evidence": f"{data['count']} questions evaluated"
                    }
                    for name, data in competency_scores.items()
                ]
            
            # Backfill readiness if not set correctly
            if not parsed.readiness or parsed.readinessScore is None:
                parsed.readiness, parsed.readinessScore = self._compute_readiness(overall_score)
            
            # Build recommendations string from roadmap
            if not parsed.recommendations:
                roadmap_str = "\n".join([f"- {item}" for item in (parsed.improvementRoadmap or [])])
                concepts_str = ", ".join(parsed.missingConcepts or [])
                parsed.recommendations = f"Missing Concepts: {concepts_str}\n\nActionable Roadmap:\n{roadmap_str}"
            
            logger.info("Generated evidence-based report. Overall: %.1f, Readiness: %s", overall_score, parsed.readiness)
            return parsed
        except Exception as e:
            logger.error("Report generation error: %s. Falling back to dynamic evaluator.", str(e))
            return self.get_mock_report(request)

    def _compute_competency_scores(self, request: ReportGenerationRequest) -> dict:
        """Groups answers by competency/category and computes average scores."""
        groups = {}
        for ans in request.answers:
            cat = getattr(ans, 'category', None) or getattr(ans, 'competency', None) or 'TECHNICAL'
            if cat not in groups:
                groups[cat] = {"scores": [], "count": 0}
            if ans.score is not None:
                groups[cat]["scores"].append(ans.score)
                groups[cat]["count"] += 1
        result = {}
        for cat, data in groups.items():
            result[cat] = {
                "avg": sum(data["scores"]) / len(data["scores"]) if data["scores"] else 0,
                "count": data["count"]
            }
        return result

    def _compute_readiness(self, overall_score: float):
        """Computes readiness label and score from overall interview score."""
        readiness_score = int(overall_score * 10)  # 0-10 score -> 0-100
        if readiness_score >= 75:
            return "INTERVIEW_READY", readiness_score
        elif readiness_score >= 50:
            return "NEEDS_IMPROVEMENT", readiness_score
        else:
            return "NOT_READY", readiness_score

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

        readiness, readiness_score = self._compute_readiness(overall_score)
        return ReportGenerationResponse(
            overallScore=overall_score,
            summary=summary,
            strengths=strengths,
            weaknesses=weaknesses,
            missingConcepts=missing_concepts,
            improvementRoadmap=roadmap,
            recommendations=recommendations,
            readiness=readiness,
            readinessScore=readiness_score,
            competencyBreakdown=[],
            roleAlignment={},
            nextInterviewPlan=roadmap[:3]
        )

# Singleton instance
report_generator_service = ReportGeneratorService()
