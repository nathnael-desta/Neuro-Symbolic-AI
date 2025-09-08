# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import validation

app = FastAPI(title="Neuro-Symbolic Chatbot API")

# Define allowed origins for development.
# In production, this should be restricted to the frontend's domain.
origins = [
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