from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import User, EmailPreference, Course, Module, Topic
from schemas import EmailPreferenceUpdate
from routers.auth import get_current_user
from services.email_service import send_progress_email, send_reminder_email

router = APIRouter()


@router.get("/preferences")
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pref = db.query(EmailPreference).filter(EmailPreference.user_id == current_user.id).first()
    if not pref:
        pref = EmailPreference(user_id=current_user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return {"weekly_progress": pref.weekly_progress, "lesson_reminders": pref.lesson_reminders}


@router.put("/preferences")
def update_preferences(
    body: EmailPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pref = db.query(EmailPreference).filter(EmailPreference.user_id == current_user.id).first()
    if not pref:
        pref = EmailPreference(user_id=current_user.id)
        db.add(pref)
    pref.weekly_progress = body.weekly_progress
    pref.lesson_reminders = body.lesson_reminders
    db.commit()
    return {"message": "Preferences updated"}


@router.post("/send-progress")
async def trigger_progress_email(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    courses = (
        db.query(Course)
        .options(joinedload(Course.modules).joinedload(Module.topics))
        .filter(Course.user_id == current_user.id)
        .all()
    )
    summary = []
    for c in courses:
        total = sum(len(m.topics) for m in c.modules)
        done = sum(1 for m in c.modules for t in m.topics if t.is_completed)
        summary.append({"topic": c.topic, "progress": f"{done}/{total}"})

    background_tasks.add_task(
        send_progress_email,
        email=current_user.email,
        username=current_user.username,
        courses=summary,
        xp=current_user.xp_points or 0,
    )
    return {"message": "Progress email queued"}


@router.post("/send-reminder")
async def trigger_reminder_email(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find incomplete topics
    pending = []
    courses = (
        db.query(Course)
        .options(joinedload(Course.modules).joinedload(Module.topics))
        .filter(Course.user_id == current_user.id)
        .all()
    )
    for c in courses:
        for m in c.modules:
            for t in m.topics:
                if not t.is_completed:
                    pending.append({"course": c.topic, "topic": t.title})
                    if len(pending) >= 3:
                        break

    background_tasks.add_task(
        send_reminder_email,
        email=current_user.email,
        username=current_user.username,
        pending_topics=pending,
    )
    return {"message": "Reminder email queued"}
