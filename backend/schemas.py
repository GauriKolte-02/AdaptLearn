from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class DiagnosticQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_answer: int

class DiagnosticRequest(BaseModel):
    topic: str

class DiagnosticSubmit(BaseModel):
    topic: str
    answers: List[int]
    questions: List[DiagnosticQuestion]

class DiagnosticResponse(BaseModel):
    score: int
    total: int
    level: str
    percentage: float

class TopicCreate(BaseModel):
    title: str
    content: str
    order: int

class TopicResponse(BaseModel):
    id: int
    title: str
    content: str
    order: int
    is_completed: bool
    class Config:
        from_attributes = True

class ModuleResponse(BaseModel):
    id: int
    title: str
    order: int
    topics: List[TopicResponse] = []
    class Config:
        from_attributes = True

class CourseResponse(BaseModel):
    id: int
    topic: str
    level: str
    outline: List[str]
    created_at: datetime
    modules: List[ModuleResponse] = []
    class Config:
        from_attributes = True

class CourseGenerateRequest(BaseModel):
    topic: str
    level: str

class TimeLogRequest(BaseModel):
    seconds: int

class YouTubeVideo(BaseModel):
    title: str
    video_id: str
    thumbnail: str
    channel: str
    url: str

class NPTELCourse(BaseModel):
    title: str
    url: str
    instructor: str
    institute: str

class EmailPrefsUpdate(BaseModel):
    email_reminders_enabled: bool

class ChatMessageRequest(BaseModel):
    message: str
    course_id: Optional[int] = None
    topic_id: Optional[int] = None
    topic_title: Optional[str] = None
    topic_content: Optional[str] = None

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    class Config:
        from_attributes = True

class AnalyticsSummary(BaseModel):
    total_courses: int
    completed_topics: int
    total_topics: int
    overall_progress: float
    total_time_seconds: int
    quiz_accuracy: float
    weak_topics: List[str]
    xp_points: int
    streak_days: int
    badges: List[str]
    courses_summary: List[dict]
    daily_activity: List[dict]

class LearningSessionCreate(BaseModel):
    topic_id: int
    duration_seconds: int

class GamificationResponse(BaseModel):
    xp_points: int
    streak_days: int
    badges: List[str]
    level_title: str
    next_badge: Optional[str] = None

