# backend/app/services/llm_service.py
import os
import json
import random
import google.generativeai as genai
from dotenv import load_dotenv
from app.schemas.hypothesis import Hypothesis

# Load environment variables from .env file
load_dotenv()

# Configure the Gemini client with your API key
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    raise

def load_vocab_from_file(path: str) -> list[str]:
    """Loads a list of vocabulary terms from a text file."""
    try:
        with open(path, 'r') as f:
            # Read lines and strip any trailing newlines
            return [line.strip() for line in f.readlines() if line.strip()]
    except FileNotFoundError:
        print(f"Warning: Vocabulary file not found at {path}")
        return []

# --- NEW: Load the vocabulary when the service starts ---
VALID_TRAITS = load_vocab_from_file('../data_processing/vocab/unique_traits.txt')
VALID_SNPS = load_vocab_from_file('../data_processing/vocab/unique_snps.txt')
VALID_CATEGORIES = load_vocab_from_file('../data_processing/vocab/unique_categories.txt')


def generate_hypotheses_from_topic(topic: str) -> list[Hypothesis]:
    """
    Uses the Gemini API to generate plausible hypotheses, constrained by the project's vocabulary.
    """
    if not all([VALID_TRAITS, VALID_SNPS, VALID_CATEGORIES]):
        print("Error: Vocabulary lists are not loaded. Cannot generate hypotheses.")
        return []

    # To avoid overwhelming the LLM, we use a representative sample of the vocabulary
    # This makes the prompt more efficient and cost-effective
    trait_sample = ", ".join(random.sample(VALID_TRAITS, min(len(VALID_TRAITS), 50)))
    snp_sample = ", ".join(random.sample(VALID_SNPS, min(len(VALID_SNPS), 50)))
    category_sample = ", ".join(random.sample(VALID_CATEGORIES, min(len(VALID_CATEGORIES), 20)))

    model = genai.GenerativeModel('gemini-2.5-flash-lite')
    
    # --- NEW: Updated prompt with vocabulary constraints ---
    prompt = f"""
    You are an expert bioinformatician's assistant. Your task is to generate 5 plausible, novel hypotheses about gene-trait associations related to the topic of "{topic}".

    You are building these hypotheses for a system with a specific, limited vocabulary.

    INSTRUCTIONS:
    1.  Your suggested 'trait' MUST be an EXACT match from the following list of available traits:
        TRAIT LIST: [{trait_sample}]

    2.  Your suggested 'snp' MUST be an EXACT match from the following list of available SNPs:
        SNP LIST: [{snp_sample}]

    3.  For context, the available trait categories are: [{category_sample}]. Use this to inform your choices.

    4.  Return your response as a single, valid JSON array of objects. Each object must contain exactly two keys: "snp" and "trait".
    """

    try:
        generation_config = genai.GenerationConfig(response_mime_type="application/json")
        response = model.generate_content(prompt, generation_config=generation_config)
        
        hypotheses_data = json.loads(response.text)
        
        # The API might return a root object, so we look for the key holding the list.
        if isinstance(hypotheses_data, dict) and len(hypotheses_data.keys()) == 1:
            key = list(hypotheses_data.keys())[0]
            hypotheses_list = hypotheses_data[key]
        else:
            hypotheses_list = hypotheses_data
            
        validated_hypotheses = [Hypothesis(**item) for item in hypotheses_list]
        return validated_hypotheses

    except (json.JSONDecodeError, TypeError, AttributeError, KeyError, ValueError) as e:
        print(f"Error parsing LLM response: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred with the Gemini API service: {e}")
        return []
