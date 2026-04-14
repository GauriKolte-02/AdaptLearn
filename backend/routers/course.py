from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from database import get_db
from pydantic import BaseModel
from models import User, Course, Module, Topic, LearningSession
from schemas import CourseGenerateRequest, CourseResponse, YouTubeVideo, NPTELCourse
from services.groq_service import generate_course_content
from services.youtube_service import search_youtube_videos
from services.nptel_service import get_nptel_courses
from services.gamification_service import award_xp_and_badges # New Service
from routers.auth import get_current_user
from typing import List
from datetime import datetime
from services.email_service import send_welcome_email, send_course_completion_email
import json


class CompletionRequest(BaseModel):
    duration_seconds: int = 0

router = APIRouter()

# Helper function to prevent repeating the eager load and JSON logic
def _load_and_format_course(course_id: int, user_id: int, db: Session) -> Course:
    course = db.query(Course).options(
        joinedload(Course.modules).joinedload(Module.topics)
    ).filter(Course.id == course_id, Course.user_id == user_id).first()
    
    # This is your original safety check!
    if not course:
        raise HTTPException(
            status_code=404, 
            detail="Course record not found."
        )

    # Your JSON parsing logic
    if isinstance(course.outline, str):
        try:
            course.outline = json.loads(course.outline)
        except Exception:
            course.outline = []
            
    return course

@router.post("/generate", response_model=CourseResponse)
async def generate_course(
    request: CourseGenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Generate content from AI
    course_data = await generate_course_content(request.topic, request.level)
    
    if not course_data or not course_data.get("modules"):
        raise HTTPException(status_code=500, detail="AI failed to generate course structure")

    # 2. Create Course record
    course = Course(
        topic=request.topic,
        level=request.level,
        outline=json.dumps(course_data.get("outline", [])),
        user_id=current_user.id
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # 3. Create Modules and Topics
    for mod_idx, module_data in enumerate(course_data.get("modules", [])):
        module = Module(
            title=module_data["title"],
            order=mod_idx + 1,
            course_id=course.id
        )
        db.add(module)
        db.commit()
        db.refresh(module)

        for topic_idx, topic_data in enumerate(module_data.get("topics", [])):
            topic = Topic(
                title=topic_data["title"],
                content=topic_data["content"],
                order=topic_idx + 1,
                module_id=module.id
            )
            db.add(topic)
        
        db.commit()
    
    # 4. Award XP for creating a course (The New Advanced Feature)
    await award_xp_and_badges(current_user.id, "course_created", db)
    
    background_tasks.add_task(send_welcome_email, current_user.email, current_user.username, request.topic)

    # 5. Load and format using the helper function
    return _load_and_format_course(course.id, current_user.id, db)

@router.get("/", response_model=List[CourseResponse])
def get_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    courses = db.query(Course).filter(Course.user_id == current_user.id).order_by(Course.created_at.desc()).all()
    
    # Format the outline for every course in the list
    for c in courses:
        if isinstance(c.outline, str):
            try:
                c.outline = json.loads(c.outline)
            except:
                c.outline = []
    return courses

@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _load_and_format_course(course_id, current_user.id, db)

@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"message": "Course deleted"}

@router.patch("/topics/{topic_id}/complete")
async def toggle_topic_complete(
    topic_id: int,
    background_tasks: BackgroundTasks, # Ensure this is passed in
    request: Optional[CompletionRequest] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    topic.is_completed = not topic.is_completed
    topic.completed_at = datetime.utcnow() if topic.is_completed else None
    
    if topic.is_completed and request.duration_seconds > 0:
        new_session = LearningSession(
            user_id=current_user.id,
            topic_id=topic.id,
            duration_seconds=request.duration_seconds,
            session_date=datetime.utcnow()
        )
        db.add(new_session)
    
    db.commit()

    newly_earned = []
    if topic.is_completed:
        # 1. Award the XP
        result = await award_xp_and_badges(current_user.id, "topic_completed", db)
        newly_earned = result.get("newly_earned", [])
        
        # 2. CRITICAL: Commit the XP changes and refresh the user object
        db.commit() 
        db.refresh(current_user)

        # --- NEW: Course Completion Email Logic ---
        # 3. Find the course this topic belongs to
        module = db.query(Module).filter(Module.id == topic.module_id).first()
        if module:
            course_id = module.course_id
            
            # Count total topics in this course
            total_topics = db.query(Topic).join(Module).filter(Module.course_id == course_id).count()
            
            # Count completed topics in this course
            completed_topics = db.query(Topic).join(Module).filter(
                Module.course_id == course_id, 
                Topic.is_completed == True
            ).count()

            # 4. If all topics are done, send the email
            if total_topics > 0 and total_topics == completed_topics:
                course = db.query(Course).filter(Course.id == course_id).first()
                background_tasks.add_task(
                    send_course_completion_email,
                    current_user.email,
                    current_user.username,
                    course.topic,
                    current_user.xp_points
                )

    return {
        "is_completed": topic.is_completed, 
        "newly_earned": newly_earned,
        "current_xp": current_user.xp_points,
        "time_added": request.duration_seconds 
    }

@router.get("/{course_id}/resources/youtube", response_model=List[YouTubeVideo])
async def get_youtube_resources(course_id: int, topic: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await search_youtube_videos(topic)

@router.get("/{course_id}/resources/nptel", response_model=List[NPTELCourse])
async def get_nptel_resources(course_id: int, topic: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await get_nptel_courses(topic)