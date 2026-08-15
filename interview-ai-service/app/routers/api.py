from fastapi import APIRouter
from app.routers.resume import router as resume_router
from app.routers.generator import router as generator_router
from app.routers.evaluator import router as evaluator_router
from app.routers.report import router as report_router
from app.routers.hint import router as hint_router

api_router = APIRouter()
api_router.include_router(resume_router)
api_router.include_router(generator_router)
api_router.include_router(evaluator_router)
api_router.include_router(report_router)
api_router.include_router(hint_router)

@api_router.get("/status", tags=["Status"])
def get_status():
    """Simple status check for the AI microservice."""
    return {
        "status": "active",
        "service": "interview-ai-service",
        "gemini_configured": True,  # Placeholder check
        "qdrant_configured": True   # Placeholder check
    }
