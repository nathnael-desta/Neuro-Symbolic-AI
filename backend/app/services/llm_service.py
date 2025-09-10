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

# --- NEW: Robust, absolute path finding ---
# This makes sure the app can always find its data files, regardless of where you run it from.
try:
    # Get the directory where this current file (llm_service.py) is located
    current_file_dir = Path(__file__).parent
    # Go up from 'services' -> 'app' -> 'backend' to the project root
    PROJECT_ROOT = current_file_dir.parent.parent.parent
    # Define the path to the knowledge base file
    PROLOG_KB_PATH = PROJECT_ROOT / 'data_processing' / 'associations.pl'
except Exception as e:
    print(f"CRITICAL ERROR: Could not determine project root directory. {e}")
    # Fallback for safety, though it may not work depending on execution context
    PROLOG_KB_PATH = Path('data_processing/associations.pl')


def parse_kb_for_filtering():
    """Parses the associations.pl file to create a lookup structure."""
    kb_data = {'by_category': {}, 'all_snps': set(), 'all_traits': set()}
    # Ensure the path exists before trying to read it
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
    Generates hypotheses using a Chain-of-Thought (CoT) prompting strategy
    to improve the quality of the generated associations.
    """
    sanitized_topic = topic.lower().replace(" ", "_")
    
    # Check if the PARSED_KB was loaded successfully
    if not PARSED_KB['all_snps']:
        return GenerationReport(status='failure', message="Knowledge base is empty or could not be loaded. Check server logs.", attempts=0, hypotheses=[])

    if sanitized_topic in PARSED_KB['by_category']:
        print(f"--- Topic '{topic}' found in KB. Using filtered vocabulary. ---")
        topic_data = PARSED_KB['by_category'][sanitized_topic]
        snp_sample_list = list(topic_data['snps'])
        trait_sample_list = list(topic_data['traits'])
    else:
        print(f"--- Topic '{topic}' not in KB categories. Using general vocabulary. ---")
        snp_sample_list = list(PARSED_KB['all_snps'])
        trait_sample_list = list(PARSED_KB['all_traits'])

    if not snp_sample_list or not trait_sample_list:
        return GenerationReport(status='failure', message=f"Could not find any vocabulary for the topic '{topic}'.", attempts=0, hypotheses=[])

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    snp_sample = ", ".join(random.sample(snp_sample_list, min(len(snp_sample_list), 100)))
    trait_sample = ", ".join(random.sample(trait_sample_list, min(len(trait_sample_list), 100)))
    
    prompt = f"""
    You are a genomic researcher. Your task is to generate {hypotheses_to_generate} plausible hypotheses related to the topic "{topic}".
    You must reason step-by-step to arrive at your conclusions.

    AVAILABLE VOCABULARY:
    - SNPs: [{snp_sample}]
    - Traits: [{trait_sample}]

    REASONING PROCESS (follow these steps):
    1.  **Analyze the Topic:** Briefly state what the topic "{topic}" means in a biological context.
    2.  **Identify Relevant Traits:** From the "Traits" list, identify a few traits that are most strongly related to your analysis of the topic. Explain your reasoning.
    3.  **Propose Connections:** For each relevant trait you identified, use your general knowledge to suggest SNPs from the "SNPs" list that might plausibly be associated with it.
    4.  **Final Output:** Format your final list of {hypotheses_to_generate} hypotheses as a clean JSON array at the very end of your response, enclosed in ```json ... ```. Do not include any other text after the JSON block.

    EXAMPLE REASONING (for topic: 'longevity'):
    Reasoning: Longevity relates to lifespan and health in old age. From the Traits list, 'age_at_death' is directly relevant. From the SNPs list, 'rs2802292' is a known variant in the FOXO3 gene associated with lifespan. Therefore, a plausible connection is ('rs2802292', 'age_at_death').

    Now, begin your step-by-step reasoning for the topic "{topic}".
    """
    
    try:
        response = model.generate_content(prompt)
        
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response.text)
        if not json_match:
            raise ValueError("LLM did not return a valid JSON block in its response.")
            
        hypotheses_data = json.loads(json_match.group(1))
        all_hypotheses = [Hypothesis(**item) for item in hypotheses_data]
    except Exception as e:
        return GenerationReport(status='failure', message=f"LLM failed to generate or parse hypotheses. Error: {e}", attempts=0, hypotheses=[])

    # --- Validation loop remains the same ---
    for i, hypo in enumerate(all_hypotheses):
        attempts_count = i + 1
        query = f"association(_, '{hypo.snp}', _, '{hypo.trait}', _)."
        solutions = prolog_service.run_query(query)

        if solutions:
            return GenerationReport(
                status='success',
                message=f"Success! After using Chain-of-Thought and checking {attempts_count} hypotheses, a match was found.",
                attempts=attempts_count,
                hypotheses=[hypo]
            )

    failed_sample = random.sample(all_hypotheses, min(len(all_hypotheses), 5))
    return GenerationReport(
        status='failure',
        message=f"No matches found after checking {len(all_hypotheses)} CoT-generated hypotheses.",
        attempts=len(all_hypotheses),
        hypotheses=failed_sample
    )

