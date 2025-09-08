# backend/app/api/v1/endpoints/generation.py
from fastapi import APIRouter, HTTPException
from app.schemas.hypothesis import TopicRequest, HypothesisList
from app.services import llm_service

router = APIRouter()

@router.post("/generate-hypotheses", response_model=HypothesisList)
async def generate_hypotheses(request: TopicRequest):
    """
    Uses an LLM to generate plausible hypotheses based on a topic.
    """
    try:
        hypotheses = llm_service.generate_hypotheses_from_topic(request.topic)
        if not hypotheses:
            raise HTTPException(status_code=500, detail="LLM failed to generate valid hypotheses.")
        
        return HypothesisList(hypotheses=hypotheses)
    except Exception as e:
        # Log the exception for debugging
        print(f"Hypothesis generation error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during hypothesis generation.")