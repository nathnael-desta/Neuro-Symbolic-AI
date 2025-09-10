# backend/app/api/v1/endpoints/generation.py
from fastapi import APIRouter, HTTPException
# MODIFICATION: Import GenerationReport instead of HypothesisList
from app.schemas.hypothesis import TopicRequest, GenerationReport
from app.services import llm_service

router = APIRouter()

# MODIFICATION: The response_model is now GenerationReport
@router.post("/generate-hypotheses", response_model=GenerationReport)
async def generate_hypotheses(request: TopicRequest):
    """
    Initiates a loop to generate and validate hypotheses against the knowledge base.
    """
    try:
        # MODIFICATION: Call the new looping function in the service
        report = llm_service.generate_and_validate_hypotheses_loop(request.topic)
        
        if not report.hypotheses and report.status == 'failure':
            raise HTTPException(status_code=500, detail="The LLM failed to generate any hypotheses to test.")
        
        return report
    except Exception as e:
        print(f"Hypothesis generation error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during hypothesis generation.")
