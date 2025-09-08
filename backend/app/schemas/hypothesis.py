# backend/app/schemas/hypothesis.py

from pydantic import BaseModel, Field
from typing import List, Optional, Union

# =================== #
#   Request Models    #
# =================== #

class Hypothesis(BaseModel):
    """A user-defined hypothesis to be validated."""
    snp: str
    trait: str
    categories: Optional[List[str]] = None

class TopicRequest(BaseModel):
    """A request to generate hypotheses based on a topic."""
    topic: str

class NaturalLanguageQuery(BaseModel):
    """A natural language query to be translated to Prolog."""
    query: str


# ==================== #
#   Response Models    #
# ==================== #

class ValidationResult(BaseModel):
    """Represents a single piece of supporting evidence from the KB."""
    pmid: int
    # Use Union to allow float or the string 'na'
    p_value_log: Union[float, str]

class ValidationReport(BaseModel):
    """The complete report for a validated hypothesis."""
    hypothesis: Hypothesis
    is_supported: bool
    supporting_evidence: List[ValidationResult]
    confidence_score: float
    explanation: str

class HypothesisList(BaseModel):
    """A list of generated hypotheses."""
    hypotheses: List[Hypothesis]

class PrologQuery(BaseModel):
    """A translated Prolog query."""
    query: str

class QueryTranslationError(BaseModel):
    """An error message for a failed NL-to-Prolog translation."""
    error: str