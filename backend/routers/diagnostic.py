from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, DiagnosticResult
from schemas import DiagnosticRequest, DiagnosticSubmit, DiagnosticResponse, DiagnosticQuestion
from services.groq_service import generate_diagnostic_questions
from routers.auth import get_current_user
from typing import List
import json

router = APIRouter()

@router.post("/generate", response_model=List[DiagnosticQuestion])
async def generate_questions(
    request: DiagnosticRequest,
    current_user: User = Depends(get_current_user)
):
    if not request.topic:
        raise HTTPException(status_code=400, detail="Topic is required")

    questions = await generate_diagnostic_questions(request.topic)

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Failed to generate diagnostic questions"
        )

    return questions

@router.post("/submit", response_model=DiagnosticResponse)
async def submit_diagnostic(
    submission: DiagnosticSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Validation Logic (From Old Version)
    if not submission.questions:
        raise HTTPException(status_code=400, detail="No questions provided")

    if len(submission.answers) != len(submission.questions):
        raise HTTPException(status_code=400, detail="Number of answers must match number of questions")

    # 2. Scoring and Weak Area Detection (Combined Logic)
    score = 0
    total = len(submission.questions)
    weak_areas = []

    for i in range(total):
        user_ans = submission.answers[i]
        correct_ans = submission.questions[i].correct_answer

        # Use the safe integer comparison from your old version
        if int(user_ans) == int(correct_ans):
            score += 1
        else:
            # Capture the question text as a weak area (From New Version)
            weak_areas.append(submission.questions[i].question)

    # 3. Analytics
    percentage = (score / total) * 100 if total > 0 else 0
    normalized = (score / total) * 10 if total > 0 else 0

    if normalized <= 3:
        level = "Beginner"
    elif normalized <= 7:
        level = "Intermediate"
    else:
        level = "Advanced"

    # 4. Database Persistence
    try:
        result = DiagnosticResult(
            topic=submission.topic,
            score=score,
            total=total,
            level=level,
            # Store weak areas as a JSON string
            weak_areas=json.dumps(weak_areas),
            user_id=current_user.id
        )
        db.add(result)
        db.commit()
        db.refresh(result)
    except Exception as e:
        db.rollback()
        # Log the error but don't crash the response
        print(f"Database Error: {e}")

    return DiagnosticResponse(
        score=score,
        total=total,
        level=level,
        percentage=round(percentage, 2),
        weak_areas=weak_areas
    )