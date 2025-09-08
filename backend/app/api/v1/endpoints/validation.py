# backend/app/api/v1/endpoints/validation.py
from fastapi import APIRouter, HTTPException
from app.schemas.hypothesis import Hypothesis, ValidationReport, ValidationResult
from app.services.prolog_service import prolog_service # Singleton instance

router = APIRouter()

@router.post("/validate", response_model=ValidationReport)
async def validate_hypothesis(hypothesis: Hypothesis):
    """
    Validates a user-submitted hypothesis against the Prolog knowledge base.
    """
    try:
        # Sanitize inputs for the Prolog query
        snp = hypothesis.snp.lower().replace("'", "\\'")
        trait = hypothesis.trait.lower().replace("'", "\\'")
        
        # Use the pre-defined 'find_snps_for_trait' rule for a direct lookup
        prolog_query = f"find_snps_for_trait('{trait}', '{snp}', PValue)."
        
        # Execute the query via the centralized service
        solutions = prolog_service.run_query(prolog_query)
        
        # Process results and build the report
        is_supported = len(solutions) > 0
        evidence = [
            ValidationResult(pmid=sol.get('PMID', 0), p_value_log=sol.get('PValue', 'na'))
            for sol in solutions
        ]
        
        # Example confidence score logic
        confidence = 0.0
        if is_supported and any(isinstance(e.p_value_log, float) for e in evidence):
            # A simple score based on the most significant p-value
            min_p_value_log = min(e.p_value_log for e in evidence if isinstance(e.p_value_log, float))
            confidence = min(1.0, -min_p_value_log / 50.0) # Normalize score
            
        explanation = (
            f"Found {len(solutions)} supporting publication(s) for the association "
            f"between {hypothesis.snp} and {hypothesis.trait}."
            if is_supported else
            "No direct evidence for this association was found in the knowledge base."
        )
        
        report = ValidationReport(
            hypothesis=hypothesis,
            is_supported=is_supported,
            supporting_evidence=evidence,
            confidence_score=confidence,
            explanation=explanation,
        )
        return report
    except Exception as e:
        # Log the exception for debugging
        print(f"Validation error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during validation.")