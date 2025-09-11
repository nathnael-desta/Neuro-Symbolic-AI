# backend/app/services/llm_service.py
import os
import json
import random
import re
import google.generativeai as genai
from dotenv import load_dotenv
from app.schemas.hypothesis import Hypothesis, GenerationReport
from app.services.prolog_service import prolog_service
from pathlib import Path

# Load environment variables from .env file
load_dotenv()
# Configure the Gemini client
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    raise

# --- Robust, absolute path finding ---
try:
    current_file_dir = Path(__file__).parent
    PROJECT_ROOT = current_file_dir.parent.parent.parent
    PROLOG_KB_PATH = PROJECT_ROOT / 'data_processing' / 'associations.pl'
except Exception as e:
    print(f"CRITICAL ERROR: Could not determine project root directory. {e}")
    PROLOG_KB_PATH = Path('data_processing/associations.pl')


def parse_kb_for_filtering():
    """Parses the associations.pl file to create a lookup structure."""
    kb_data = {'by_category': {}, 'all_snps': set(), 'all_traits': set()}
    if not PROLOG_KB_PATH.exists():
        print(f"CRITICAL: Knowledge base file not found at '{PROLOG_KB_PATH}'")
        return kb_data
        
    try:
        with open(PROLOG_KB_PATH, 'r') as f:
            for line in f:
                if not line.startswith('association('):
                    continue
                match = re.search(r"association\(\d+, '([^']*)', \[(.*)\], '([^']*)', .*\)\.", line)
                if match:
                    snp, categories_str, trait = match.groups()
                    categories = [cat.strip().strip("'") for cat in categories_str.split(',')]
                    kb_data['all_snps'].add(snp)
                    kb_data['all_traits'].add(trait)
                    for category in categories:
                        if category not in kb_data['by_category']:
                            kb_data['by_category'][category] = {'snps': set(), 'traits': set()}
                        kb_data['by_category'][category]['snps'].add(snp)
                        kb_data['by_category'][category]['traits'].add(trait)
    except Exception as e:
        print(f"CRITICAL: Failed to parse knowledge base for filtering. Error: {e}")
    return kb_data

PARSED_KB = parse_kb_for_filtering()

def generate_and_validate_hypotheses_loop(topic: str, hypotheses_to_generate: int = 40) -> GenerationReport:
    """
    Generates hypotheses using a stricter CoT prompt and detailed logging.
    """
    print("\n--- [START] Hypothesis Generation and Validation ---")
    try:
        sanitized_topic = topic.lower().replace(" ", "_")
        
        if not PARSED_KB['all_snps']:
            print("[ERROR] Knowledge base is empty or could not be loaded. Aborting.")
            return GenerationReport(status='failure', message="Knowledge base is empty. Check logs.", attempts=0, hypotheses=[])

        if sanitized_topic in PARSED_KB['by_category']:
            print(f"[DEBUG] Topic '{topic}' found in KB. Using filtered vocabulary.")
            topic_data = PARSED_KB['by_category'][sanitized_topic]
            snp_sample_list, trait_sample_list = list(topic_data['snps']), list(topic_data['traits'])
        else:
            print(f"[DEBUG] Topic '{topic}' not in KB categories. Using general vocabulary.")
            snp_sample_list, trait_sample_list = list(PARSED_KB['all_snps']), list(PARSED_KB['all_traits'])

        if not snp_sample_list or not trait_sample_list:
             return GenerationReport(status='failure', message=f"No vocabulary for topic '{topic}'.", attempts=0, hypotheses=[])
        print(f"[DEBUG] Vocabulary ready with {len(snp_sample_list)} SNPs and {len(trait_sample_list)} traits.")

        model = genai.GenerativeModel('gemini-1.5-flash')
        snp_sample = ", ".join(random.sample(snp_sample_list, min(len(snp_sample_list), 100)))
        trait_sample = ", ".join(random.sample(trait_sample_list, min(len(trait_sample_list), 100)))
        
        prompt = f"""
        You are a genomic researcher. Your task is to generate {hypotheses_to_generate} plausible hypotheses related to the topic "{topic}".
        First, you must reason step-by-step. Second, you must provide your final answer in a specific JSON format.

        AVAILABLE VOCABULARY:
        - SNPs: [{snp_sample}]
        - Traits: [{trait_sample}]

        REASONING PROCESS:
        1.  Analyze the Topic: "{topic}".
        2.  Identify Relevant Traits from the "Traits" list.
        3.  Propose Connections with SNPs from the "SNPs" list.

        FINAL OUTPUT FORMAT:
        After your reasoning, you MUST provide a final list of {hypotheses_to_generate} hypotheses as a clean JSON array enclosed in ```json ... ```.
        Each object in the array MUST have exactly two keys: "snp" and "trait". Do not include any other text after the JSON block.

        EXAMPLE FINAL OUTPUT:
        ```json
        [
          {{"snp": "rs12345", "trait": "example_trait_1"}},
          {{"snp": "rs67890", "trait": "example_trait_2"}}
        ]
        ```
        
        Now, begin your step-by-step reasoning for the topic "{topic}".
        """
        
        print("[DEBUG] Calling Gemini API...")
        response = model.generate_content(prompt)
        
        if not response.parts:
            safety_feedback = response.prompt_feedback
            error_details = f"LLM response was blocked. Reason: {safety_feedback.block_reason}."
            print(f"[ERROR] {error_details}")
            raise ValueError(error_details)
        
        print("[DEBUG] LLM call successful. Parsing JSON block...")
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response.text)
        if not json_match:
            print("[ERROR] LLM did not return a valid JSON block. Full response text:")
            print(response.text)
            raise ValueError("LLM response did not contain a valid JSON block.")
            
        hypotheses_data = json.loads(json_match.group(1))
        print("[DEBUG] JSON parsed successfully. Validating with Pydantic...")
        all_hypotheses = [Hypothesis(**item) for item in hypotheses_data]
        print(f"[DEBUG] Pydantic validation successful. Generated {len(all_hypotheses)} hypotheses.")

    except Exception as e:
        print("\n" + "="*50)
        print("CRITICAL FAILURE IN LLM GENERATION STEP")
        print(f"The specific error was: {type(e).__name__}: {e}")
        print("="*50 + "\n")
        return GenerationReport(status='failure', message=f"LLM failed to generate or parse. Error: {e}", attempts=0, hypotheses=[])

    # --- Validation loop with enhanced reporting ---
    checked_hypotheses = []
    for i, hypo in enumerate(all_hypotheses):
        attempts_count = i + 1
        query = f"association(_, '{hypo.snp}', _, '{hypo.trait}', _)."
        solutions = prolog_service.run_query(query)

        if solutions:
            print(f"[SUCCESS] Match found after {attempts_count} attempts!")
            failed_sample = random.sample(checked_hypotheses, min(len(checked_hypotheses), 5))
            return GenerationReport(
                status='success',
                message=f"Success! After checking {attempts_count} hypotheses, a match was found.",
                attempts=attempts_count,
                hypotheses=[hypo],
                tested_hypotheses=failed_sample
            )
        
        checked_hypotheses.append(hypo)

    print(f"[INFO] Full validation loop completed after {len(all_hypotheses)} checks. No matches found.")
    failed_sample = random.sample(checked_hypotheses, min(len(checked_hypotheses), 5))
    return GenerationReport(
        status='failure',
        message=f"No matches found after checking {len(all_hypotheses)} CoT-generated hypotheses.",
        attempts=len(all_hypotheses),
        hypotheses=failed_sample,
        tested_hypotheses=None
    )
