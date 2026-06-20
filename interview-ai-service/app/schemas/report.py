from pydantic import BaseModel, Field
from typing import List

class AnswerDetail(BaseModel):
    questionText: str = Field(description="The question that was asked")
    answerText: str = Field(description="The answer text transcript provided by the candidate")
    expectedKeywords: List[str] = Field(default=[], description="Expected keywords or technical terms")
    score: int = Field(description="The evaluated score (0-10) for this answer")
    feedback: str = Field(description="Constructive feedback for this specific answer")

class ReportGenerationRequest(BaseModel):
    answers: List[AnswerDetail] = Field(description="List of all question-answer evaluation details from the session")

class ReportGenerationResponse(BaseModel):
    overallScore: float = Field(
        description="The overall aggregated score of the candidate's performance, from 0.0 to 10.0"
    )
    summary: str = Field(description="A high-level qualitative summary of the candidate's interview performance")
    strengths: List[str] = Field(description="List of core strengths demonstrated during the session")
    weaknesses: List[str] = Field(description="List of weak areas or gaps in knowledge")
    missingConcepts: List[str] = Field(description="Key technical topics or tools the candidate missed or was weak on")
    improvementRoadmap: List[str] = Field(description="Step-by-step actionable recommendations and study plan")
    recommendations: str = Field(
        description="A consolidated string version of the roadmap and missed concepts for Spring Boot API gateway mapping"
    )
