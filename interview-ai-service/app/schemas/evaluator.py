from pydantic import BaseModel, Field
from typing import List

class AnswerEvaluationRequest(BaseModel):
    questionText: str = Field(description="The interview question that was asked")
    expectedKeywords: List[str] = Field(default=[], description="List of expected keywords, technologies, or concepts")
    answerText: str = Field(description="The transcribed candidate answer text")

class AnswerEvaluationResponse(BaseModel):
    technicalScore: int = Field(
        description="Rating of the technical accuracy of the answer, from 0 (completely incorrect) to 10 (fully accurate)"
    )
    communicationScore: int = Field(
        description="Rating of the communication clarity, vocabulary, and articulation, from 0 to 10"
    )
    depthScore: int = Field(
        description="Rating of the technical depth, explanation of mechanisms, or context, from 0 to 10"
    )
    completenessScore: int = Field(
        description="Rating of how completely the answer addressed all aspects of the question and expected keywords, from 0 to 10"
    )
    feedback: str = Field(description="Constructive and detailed feedback summarizing strengths, missed concepts, and suggestions")
    score: int = Field(
        description="The overall aggregated score from 0 to 10. (Will be calculated as the mathematical average of the four scores)"
    )
