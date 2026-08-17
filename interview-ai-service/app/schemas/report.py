from pydantic import BaseModel, Field, AliasChoices
from typing import List, Optional

class AnswerDetail(BaseModel):
    questionText: str = Field(description="The question that was asked")
    answerText: str = Field(description="The answer text transcript provided by the candidate")
    expectedKeywords: List[str] = Field(default=[], description="Expected keywords or technical terms")
    score: float = Field(description="The evaluated score (0-10) for this answer")
    feedback: str = Field(description="Constructive feedback for this specific answer")
    category: Optional[str] = Field(default="TECHNICAL")
    competency: Optional[str] = Field(default=None)

class ReportGenerationRequest(BaseModel):
    answers: List[AnswerDetail] = Field(description="List of all question-answer evaluation details from the session")
    job_title: Optional[str] = Field(default=None, validation_alias=AliasChoices('jobTitle', 'job_title'))
    company_name: Optional[str] = Field(default=None, validation_alias=AliasChoices('companyName', 'company_name'))
    interview_type: Optional[str] = Field(default="TECHNICAL", validation_alias=AliasChoices('interviewType', 'interview_type'))
    difficulty: Optional[str] = Field(default="MID")
    resume_skills: Optional[List[str]] = Field(default_factory=list, validation_alias=AliasChoices('resumeSkills', 'resume_skills'))
    competency_names: Optional[List[str]] = Field(default_factory=list, validation_alias=AliasChoices('competencyNames', 'competency_names'))

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
    readiness: Optional[str] = Field(default="NEEDS_IMPROVEMENT", description="INTERVIEW_READY | NEEDS_IMPROVEMENT | NOT_READY")
    readinessScore: Optional[int] = Field(default=50, description="0-100 readiness score")
    competencyBreakdown: Optional[List[dict]] = Field(default_factory=list, description="Per-competency score breakdown")
    roleAlignment: Optional[dict] = Field(default_factory=dict, description="Resume skills vs JD gap analysis")
    nextInterviewPlan: Optional[List[str]] = Field(default_factory=list, description="Personalised improvement plan")
