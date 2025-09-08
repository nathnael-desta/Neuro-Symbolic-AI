# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# MODIFICATION: Import the new generation router
from app.api.v1.endpoints import validation, generation 

app = FastAPI(title="Neuro-Symbolic Chatbot API")

origins = [
    # Ensure your frontend URL is listed here
    "http://localhost:5173", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the validation router
app.include_router(validation.router, prefix="/api/v1", tags=["validation"])
# MODIFICATION: Include the new generation router
app.include_router(generation.router, prefix="/api/v1", tags=["generation"])