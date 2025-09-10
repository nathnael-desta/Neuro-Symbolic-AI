Neuro-Symbolic AI Chatbot for Gene-Trait Association
This project is a sophisticated, full-stack web application that demonstrates the power of neuro-symbolic AI. It combines a symbolic reasoning engine (SWI-Prolog) with a generative large language model (Google's Gemini) to create a chatbot that can both validate existing scientific data and generate novel, testable hypotheses about gene-trait associations.

Architecture
The system is built on a modern, decoupled architecture, ensuring scalability and maintainability.

React Frontend: A single-page application that provides the user-facing chatbot interface. It communicates exclusively with the backend API.

FastAPI Backend: A high-performance Python web server that acts as the central API gateway. It orchestrates all logic, handling requests, interfacing with the Prolog engine, and managing calls to the external LLM service.

SWI-Prolog Knowledge Base: A symbolic reasoning engine that houses a knowledge base of gene-trait association facts. It provides verifiable, ground-truth answers for validation requests.

Google Gemini LLM: The "neuro" component of the system. It is used for advanced reasoning tasks, such as mapping user topics to internal data categories and generating novel hypotheses using a Chain-of-Thought process.

Data Processing Pipeline: A standalone Python script responsible for the one-time ETL (Extract, Transform, Load) process. It ingests raw data, cleans it, and generates the Prolog knowledge base and the vocabulary files used by the backend.

Features
Direct Hypothesis Validation: Users can submit a specific (SNP, Trait) pair to check if a supporting fact exists in the knowledge base.

Intelligent Hypothesis Generation: Users can provide a high-level topic (e.g., "longevity," "inflammation"). The system then uses a sophisticated two-agent LLM strategy to generate a list of plausible, novel hypotheses that are guaranteed to be testable against the knowledge base's vocabulary.

Chain-of-Thought Reasoning: The hypothesis generation process is guided by a Chain-of-Thought (CoT) prompt, which forces the LLM to reason step-by-step, dramatically improving the quality and relevance of its suggestions.

Project Structure
The project is organized as a monorepo with a clear separation of concerns.

/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/              # API endpoint definitions
│   │   ├── services/         # Business logic (Prolog and LLM services)
│   │   ├── schemas/          # Pydantic data models
│   │   └── main.py           # Main application entry point
│   ├── .env                  # For API keys (must be created)
│   └── requirements.txt
├── data_processing/          # Scripts and data for the knowledge base
│   ├── vocab/                # Generated vocabulary files (created by script)
│   ├── associations.pl       # The generated Prolog KB (created by script)
│   ├── associations.tsv      # The raw input data
│   └── process_data.py       # The ETL script
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── ...
│   ├── .env.local            # For environment variables (must be created)
│   └── package.json
└── README.md

Setup and Installation
Prerequisites
Python 3.10+

Node.js 18+ and npm

SWI-Prolog: You must have SWI-Prolog installed on your system and available in your system's PATH.

1. Backend Setup
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Create the environment file for your API key
# Create a new file named .env in the backend/ directory
# Add your Google Gemini API key to it:
# GEMINI_API_KEY="AIza..."

2. Frontend Setup
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Create the environment file for the API URL
# Create a new file named .env.local in the frontend/ directory
# Add the URL of your running backend server:
# VITE_API_BASE_URL="[http://127.0.0.1:6001](http://127.0.0.1:6001)"

Running the Application
You will need to run three separate processes, ideally in three separate terminal windows.

1. Process the Data (Run this once)
This script generates the knowledge base and all necessary vocabulary files.

# From the project's root directory
python data_processing/process_data.py

2. Start the Backend Server
# From the project's root directory
uvicorn app.main:app --reload --app-dir backend/ --port 6001

The server will be running at http://127.0.0.1:6001.

3. Start the Frontend Application
# From the frontend/ directory
npm run dev

The application will be accessible in your browser, typically at http://localhost:5173.

How to Use the Chatbot
Direct Validation: To check a specific hypothesis, type a message in the format:
validate <snp_id> and <trait_name>
Example: validate rs2543600 and age_at_death

Generate Hypotheses: Click the "Suggest Hypotheses" button in the header. You will be prompted to enter a topic (e.g., cardiovascular disease). The system will then perform its two-agent reasoning and return a list of high-quality suggestions. Click on any suggestion to validate it automatically.