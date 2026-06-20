from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class QuestionGenerationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    resume_text: str = Field(validation_alias="resumeText", description="The extracted raw text of the candidate's resume")
    job_description_text: str = Field(validation_alias="jobDescriptionText", description="The target job description requirements")
    difficulty: Optional[str] = Field("MID", description="Target difficulty level: JUNIOR, MID, or SENIOR")
    resume_id: Optional[int] = Field(None, validation_alias="resumeId", description="Optional DB resume ID to retrieve semantically parsed vector context")

class GeneratedQuestionItem(BaseModel):
    question_text: str = Field(description="The formulated interview question")
    category: str = Field(description="The question type classification: RESUME, TECHNICAL, DSA, or HR")
    difficulty: str = Field(description="The difficulty level of this question: JUNIOR, MID, or SENIOR")
    expected_keywords: List[str] = Field(
        description="Key programming terms, tools, methodologies, or concepts expected in the candidate's response"
    )

class QuestionGenerationResponse(BaseModel):
    questions: List[GeneratedQuestionItem] = Field(
        description="List of exactly 45 generated questions (20 RESUME, 20 TECHNICAL, 3 DSA, 2 HR)"
    )
