from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, Course, Module, Topic, LearningSession, DiagnosticResult
from schemas import AnalyticsSummary, LearningSessionCreate
from routers.auth import get_current_user
from datetime import datetime, timedelta
import json

router = APIRouter()


@router.post("/session")
def log_session(
    session_data: LearningSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = LearningSession(
        user_id=current_user.id,
        course_id=session_data.course_id,
        topic_id=session_data.topic_id,
        duration_seconds=session_data.duration_seconds,
    )
    db.add(session)
    # Update streak
    today = datetime.utcnow().date()
    last = current_user.last_activity_date
    if last:
        delta = today - last.date()
        if delta.days == 1:
            current_user.streak_days += 1
        elif delta.days > 1:
            current_user.streak_days = 1
    else:
        current_user.streak_days = 1
    current_user.last_activity_date = datetime.utcnow()
    db.commit()
    return {"message": "Session logged"}


@router.get("/", response_model=AnalyticsSummary)

def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    courses = (
        db.query(Course)
        .filter(Course.user_id == current_user.id)
        .all()
    )

    total_topics = 0
    completed_topics = 0
    weak_topics = []
    course_breakdown = []

    for course in courses:
        c_total = 0
        c_done = 0
        for module in course.modules:
            for topic in module.topics:
                total_topics += 1
                c_total += 1
                if topic.is_completed:
                    completed_topics += 1
                    c_done += 1
                if topic.is_weak:
                    weak_topics.append(topic.title)
        course_breakdown.append({
            "id": course.id,
            "topic": course.topic,
            "level": course.level,
            "total": c_total,
            "completed": c_done,
            "pct": round(c_done / c_total * 100) if c_total else 0,
        })

    # Total time
    total_time = (
        db.query(func.sum(LearningSession.duration_seconds))
        .filter(LearningSession.user_id == current_user.id)
        .scalar()
    ) or 0

    # Quiz accuracy from diagnostic results
    results = db.query(DiagnosticResult).filter(DiagnosticResult.user_id == current_user.id).all()
    quiz_accuracy = 0.0
    if results:
        quiz_accuracy = sum(r.score / r.total for r in results if r.total) / len(results) * 100

    # Daily activity last 14 days
    cutoff = datetime.utcnow() - timedelta(days=14)
    sessions = (
        db.query(LearningSession)
        .filter(LearningSession.user_id == current_user.id, LearningSession.session_date >= cutoff)
        .all()
    )
    daily = {}
    for s in sessions:
        day = s.session_date.strftime("%Y-%m-%d")
        daily[day] = daily.get(day, 0) + s.duration_seconds
    daily_activity = [{"date": k, "seconds": v} for k, v in sorted(daily.items())]

    return AnalyticsSummary(
        total_courses=len(courses),
        completed_topics=completed_topics,
        total_topics=total_topics,
        overall_progress=round((completed_topics / total_topics * 100), 1) if total_topics > 0 else 0.0,
        total_time_seconds=total_time,
        quiz_accuracy=round(quiz_accuracy, 1),
        weak_topics=weak_topics[:10],
        xp_points=current_user.xp_points or 0,
        streak_days=current_user.streak_days or 0,
        badges=[],
        courses_summary=course_breakdown,
        daily_activity=daily_activity
    )