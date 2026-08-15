from fastapi import APIRouter, HTTPException
from app.schemas.hint import HintRequest, HintResponse
from app.services.hint_service import hint_service

router = APIRouter(tags=["AI Hint Assistant"])

@router.post("/get-hint", response_model=HintResponse)
def get_hint(request: HintRequest):
    """Exposes POST /api/v1/get-hint to generate encouraging, conceptual tips."""
    try:
        return hint_service.generate_hint(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate hint: {str(e)}")
