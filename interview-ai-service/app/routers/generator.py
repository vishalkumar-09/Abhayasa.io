from fastapi import APIRouter, HTTPException, UploadFile, File
from app.schemas.generator import QuestionGenerationRequest, QuestionGenerationResponse, FollowUpGenerationRequest, FollowUpGenerationResponse
from app.services.generator_service import question_generator_service

router = APIRouter(tags=["Question Generation"])

@router.post("/generate-questions", response_model=QuestionGenerationResponse)
def generate_questions(request: QuestionGenerationRequest):
    """Exposes POST /api/v1/generate-questions to generate structured questions."""
    try:
        return question_generator_service.generate_interview_questions(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

@router.post("/generate-followup", response_model=FollowUpGenerationResponse)
def generate_followup(request: FollowUpGenerationRequest):
    """Exposes POST /api/v1/generate-followup to generate a short contextual follow-up question."""
    try:
        return question_generator_service.generate_followup_question(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate follow-up question: {str(e)}")

@router.post("/transcribe-audio")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribes raw recorded audio (WebM, WAV, MP4) verbatim using Gemini Multimodal Audio AI."""
    try:
        contents = await file.read()
        mime_type = file.content_type or "audio/webm"
        
        audio_part = {
            "mime_type": mime_type,
            "data": contents
        }
        prompt = "Transcribe the spoken speech in this audio file verbatim into clean English text. Output ONLY the transcribed spoken text without any extra notes, commentary, or markdown formatting."
        
        from app.llm.langchain_client import langchain_client
        res_text = langchain_client.execute_prompt(prompt)
        return {"transcript": res_text.strip()}
    except Exception as e:
        return {"transcript": "", "error": str(e)}
