from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, TutorMessage, Topic
from schemas import ChatMessageRequest, ChatMessageResponse
from services.groq_service import ai_tutor_chat
from routers.auth import get_current_user
from typing import List

router = APIRouter()


@router.post("/", response_model=ChatMessageResponse)
async def send_message(
    body: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Fetch recent conversation history (last 10 messages)
    history = (
        db.query(TutorMessage)
        .filter(
            TutorMessage.user_id == current_user.id,
            TutorMessage.course_id == body.course_id,
        )
        .order_by(TutorMessage.created_at.desc())
        .limit(10)
        .all()
    )
    history_msgs = [{"role": m.role, "content": m.content} for m in reversed(history)]

    # Save the user message
    user_msg = TutorMessage(
        course_id=body.course_id,
        topic_id=body.topic_id,
        role="user",
        content=body.message,
        user_id=current_user.id,
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Get AI response
    ai_reply = await ai_tutor_chat(
        message=body.message,
        history=history_msgs,
        topic_title=body.topic_title,
        topic_content=body.topic_content,
    )

    # Save assistant message
    ai_msg = TutorMessage(
        course_id=body.course_id,
        topic_id=body.topic_id,
        role="assistant",
        content=ai_reply,
        user_id=current_user.id,
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return ai_msg


@router.get("/history", response_model=List[ChatMessageResponse])
def get_history(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = (
        db.query(TutorMessage)
        .filter(
            TutorMessage.user_id == current_user.id,
            TutorMessage.course_id == course_id,
        )
        .order_by(TutorMessage.created_at.asc())
        .all()
    )
    return messages


@router.delete("/history")
def clear_history(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(TutorMessage).filter(
        TutorMessage.user_id == current_user.id,
        TutorMessage.course_id == course_id,
    ).delete()
    db.commit()
    return {"message": "Chat history cleared"}
