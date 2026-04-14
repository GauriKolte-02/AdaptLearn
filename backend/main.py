import os
from pathlib import Path
from dotenv import load_dotenv

# This finds the directory where main.py lives and looks for .env there
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

print(f"DEBUG: Looking for .env at: {env_path}")
print(f"DEBUG: Key found? {'Yes' if os.getenv('GROQ_API_KEY') else 'No'}")
# ... rest of your code
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, course, diagnostic
from routers import analytics
from routers import chat

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Adaptive Learning Course Generator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(course.router, prefix="/api/courses", tags=["courses"])
app.include_router(diagnostic.router, prefix="/api/diagnostic", tags=["diagnostic"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

@app.get("/")
def root():
    return {"message": "Adaptive Learning Course Generator API"}
