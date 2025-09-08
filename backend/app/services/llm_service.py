# backend/app/services/llm_service.py
import os
import json
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
    # This will prevent the app from starting if the key is missing/invalid, which is good for debugging.
    raise

def generate_hypotheses_from_topic(topic: str) -> list[Hypothesis]:
    """
    Uses the Gemini API to generate a list of plausible hypotheses,
    constrained to a specific JSON output format.
    """
    # Use a reliable and current model name.
    # 'gemini-1.5-flash' is a great choice.
    model = genai.GenerativeModel('gemini-2.5-flash-lite')
    
    # This prompt is engineered to guide the model's thinking.
    prompt = f"""
    You are an expert bioinformatician's assistant with deep knowledge of genomics.
    Your task is to generate 5 plausible, novel hypotheses about gene-trait associations related to the topic of "{topic}".
    For each hypothesis, you must provide:
    1. A potential SNP ID, which must be a valid RefSNP identifier starting with 'rs'.
    2. A specific, well-defined biological trait.
    Return your response as a single, valid JSON array of objects.
    Each object in the array must contain exactly two keys: "snp" and "trait".
    """

    try:
        # Use the native JSON mode for reliable, structured output
        generation_config = genai.GenerationConfig(
            response_mime_type="application/json"
        )
        
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        # Parse the JSON string from the LLM's response text
        hypotheses_data = json.loads(response.text)
        
        # The Gemini API might return a root object, so we look for the key holding the list.
        # This makes the code more robust if the model wraps its output.
        if isinstance(hypotheses_data, dict) and len(hypotheses_data.keys()) == 1:
            key = list(hypotheses_data.keys())[0]
            hypotheses_list = hypotheses_data[key]
        else:
            hypotheses_list = hypotheses_data

        # Validate the structure using Pydantic models
        validated_hypotheses = [Hypothesis(**item) for item in hypotheses_list]
        return validated_hypotheses

    except (json.JSONDecodeError, TypeError, AttributeError, KeyError) as e:
        print(f"Error parsing LLM response: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred with the Gemini API service: {e}")
        return []