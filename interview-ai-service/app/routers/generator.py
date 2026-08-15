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
    """Transcribes raw recorded audio (WebM, WAV, MP4) verbatim using Gemini Multimodal Audio AI or Groq Whisper."""
    try:
        contents = await file.read()
        if not contents or len(contents) < 50:
            return {"transcript": "", "error": "No audio file detected or payload empty."}

        mime_type = file.content_type or "audio/webm"
        filename = file.filename or "speech.webm"
        if not mime_type or mime_type == "application/octet-stream":
            if filename.endswith(".mp4"):
                mime_type = "audio/mp4"
            elif filename.endswith(".aac"):
                mime_type = "audio/aac"
            elif filename.endswith(".wav"):
                mime_type = "audio/wav"
            else:
                mime_type = "audio/webm"
        
        from app.llm.langchain_client import langchain_client
        res_text = langchain_client.transcribe_audio_bytes(contents, mime_type)
        return {"transcript": res_text.strip()}
    except Exception as e:
        logger.error("Audio transcription error: %s", str(e))
        return {"transcript": "", "error": str(e)}
