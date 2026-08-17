from pydantic import BaseModel, Field, ConfigDict, AliasChoices
from typing import List, Optional

class QuestionGenerationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    resume_text: str = Field(validation_alias="resumeText", description="The extracted raw text of the candidate's resume")
    job_description_text: str = Field(validation_alias="jobDescriptionText", description="The target job description requirements")
    difficulty: Optional[str] = Field("MID", description="Target difficulty level: JUNIOR, MID, or SENIOR")
    resume_id: Optional[int] = Field(None, validation_alias="resumeId", description="Optional DB resume ID to retrieve semantically parsed vector context")
    job_title: Optional[str] = Field(None, validation_alias="jobTitle", description="The target job title")
    company_name: Optional[str] = Field(None, validation_alias="companyName", description="The target company name")
    interview_type: Optional[str] = Field("TECHNICAL", validation_alias="interviewType", description="The type of interview: TECHNICAL or HR")
    previous_questions: Optional[List[str]] = Field(default_factory=list, validation_alias=AliasChoices('previousQuestions', 'previous_questions'), description="Already-asked question texts for anti-repetition")
    resume_structured: Optional[dict] = Field(default=None, validation_alias=AliasChoices('resumeStructured', 'resume_structured'), description="Parsed resume JSON with skills, projects, experience")
    interview_round: Optional[str] = Field(default="FIRST", validation_alias=AliasChoices('interviewRound', 'interview_round'), description="FIRST, TECHNICAL, or FINAL")

class GeneratedQuestionItem(BaseModel):
    question_text: str = Field(description="The formulated interview question")
    category: str = Field(description="The question type classification: RESUME, TECHNICAL, DSA, or HR")
    difficulty: str = Field(description="The difficulty level of this question: JUNIOR, MID, or SENIOR")
    expected_keywords: List[str] = Field(
        description="Key programming terms, tools, methodologies, or concepts expected in the candidate's response"
    )
    competency: Optional[str] = Field(default=None, description="Which blueprint competency this question evaluates")
    is_primary: Optional[bool] = Field(default=True, description="True for primary questions, False for follow-ups")

class QuestionGenerationResponse(BaseModel):
    questions: List[GeneratedQuestionItem] = Field(
        description="List of generated questions (target 15, min 10, max 18 primary questions)"
    )

class FollowUpGenerationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    question_text: str = Field(validation_alias="questionText", description="The current main question or previous follow-up question")
    answer_text: str = Field(validation_alias="answerText", description="The candidate's spoken or typed answer to the question")
    history: Optional[List[str]] = Field(default=[], description="List of previous follow-up questions asked for this main question")

class FollowUpGenerationResponse(BaseModel):
    followupQuestion: str = Field(description="The generated short follow-up question")
