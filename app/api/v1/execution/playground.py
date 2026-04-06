from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.services.playground_service import playground_service, PlaygroundSessionRequest, PlaygroundSessionResult
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/run", response_model=PlaygroundSessionResult)
async def run_playground_session(
    request: PlaygroundSessionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Run a playground session with the specified agent configuration and test cases.
    """
    if not request.test_cases:
        raise HTTPException(status_code=400, detail="At least one test case must be provided.")
    
    return await playground_service.run_session(request)

@router.get("/history")
async def get_playground_history(current_user: User = Depends(get_current_user)):
    """
    Retrieve historical playground experiments for the current user.
    """
    # Placeholder for historical logic
    return []
