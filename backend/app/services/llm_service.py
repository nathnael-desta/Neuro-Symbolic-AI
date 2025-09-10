# backend/app/services/llm_service.py
import os
import json
import random
import google.generativeai as genai
from dotenv import load_dotenv
from app.schemas.hypothesis import Hypothesis, GenerationReport
# --- We need the prolog_service to perform live validation ---
from app.services.prolog_service import prolog_service

# Load environment variables from .env file
load_dotenv()

# Configure the Gemini client
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    raise

def load_vocab_from_file(path: str) -> list[str]:
    try:
        with open(path, 'r') as f:
            return [line.strip() for line in f.readlines() if line.strip()]
    except FileNotFoundError:
        print(f"Warning: Vocabulary file not found at {path}")
        return []

VALID_TRAITS = load_vocab_from_file('../data_processing/vocab/unique_traits.txt')
VALID_SNPS = load_vocab_from_file('../data_processing/vocab/unique_snps.txt')
VALID_CATEGORIES = load_vocab_from_file('../data_processing/vocab/unique_categories.txt')



# MODIFICATION: Added 'num_llm_calls' (your 'y' variable)
def generate_and_validate_hypotheses_loop(topic: str, hypotheses_per_call: int = 50, num_llm_calls: int = 2) -> GenerationReport:
    """
    Generates batches of hypotheses and validates them. Can make multiple LLM calls.
    - hypotheses_per_call (x): How many ideas to ask for in each API call.
    - num_llm_calls (y): How many times to call the API if no match is found.
    """
    if not all([VALID_TRAITS, VALID_SNPS, VALID_CATEGORIES]):
        return GenerationReport(status='failure', message="Vocabulary lists are not loaded.", attempts=0, hypotheses=[])

    model = genai.GenerativeModel('gemini-1.5-flash')
    total_attempts = 0
    all_checked_hypotheses = []
    
    # This is the outer loop for 'y' - the number of times we call the LLM
    for i in range(num_llm_calls):
        print(f"--- Starting LLM Call #{i+1} of {num_llm_calls} ---")
        
        trait_sample = ", ".join(random.sample(VALID_TRAITS, min(len(VALID_TRAITS), 75)))
        snp_sample = ", ".join(random.sample(VALID_SNPS, min(len(VALID_SNPS), 75)))
        category_sample = ", ".join(random.sample(VALID_CATEGORIES, min(len(VALID_CATEGORIES), 30)))
        
        prompt = f"""
        You are an expert bioinformatician's assistant. Your task is to generate {hypotheses_per_call} plausible, novel hypotheses about gene-trait associations related to the topic of "{topic}".
        INSTRUCTIONS:
        1. Your 'trait' MUST be an EXACT match from this list: [{trait_sample}]
        2. Your 'snp' MUST be an EXACT match from this list: [{snp_sample}]
        3. For context, the available trait categories are: [{category_sample}].
        4. Return your response as a valid JSON array of objects with "snp" and "trait" keys.
        """
        
        try:
            config = genai.GenerationConfig(response_mime_type="application/json")
            response = model.generate_content(prompt, generation_config=config)
            
            if not response.parts:
                safety_feedback = response.prompt_feedback
                error_details = f"LLM call #{i+1} was blocked by API safety filters. Reason: {safety_feedback.block_reason}."
                return GenerationReport(status='failure', message=error_details, attempts=total_attempts, hypotheses=[])

            hypotheses_data = json.loads(response.text)
            key = list(hypotheses_data.keys())[0] if isinstance(hypotheses_data, dict) else None
            current_batch = [Hypothesis(**item) for item in (hypotheses_data[key] if key else hypotheses_data)]
        except Exception as e:
            last_llm_error = str(e)
            return GenerationReport(status='failure', message=f"LLM call #{i+1} failed. Error: {last_llm_error}", attempts=total_attempts, hypotheses=[])

        # Inner loop to validate the batch we just received
        for hypo in current_batch:
            total_attempts += 1
            all_checked_hypotheses.append(hypo)
            
            query = f"association(_, '{hypo.snp}', _, '{hypo.trait}', _)."
            solutions = prolog_service.run_query(query)

            if solutions:
                return GenerationReport(
                    status='success',
                    message=f"Success! After checking {total_attempts} total hypotheses across {i+1} API call(s), a match was found.",
                    attempts=total_attempts,
                    hypotheses=[hypo]
                )

    # --- FAILURE: All loops finished without finding anything. ---
    failed_sample = random.sample(all_checked_hypotheses, min(len(all_checked_hypotheses), 5))
    
    return GenerationReport(
        status='failure',
        message=f"No matches found after checking {total_attempts} hypotheses across {num_llm_calls} API call(s).",
        attempts=total_attempts,
        hypotheses=failed_sample
    )

