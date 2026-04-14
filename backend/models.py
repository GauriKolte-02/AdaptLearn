from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from pydantic import BaseModel

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    xp_points = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    last_activity_date = Column(DateTime(timezone=True), nullable=True)
    email_reminders_enabled = Column(Boolean, default=True)

    courses = relationship("Course", back_populates="owner")
    badges = relationship("UserBadge", back_populates="user")
    chat_messages = relationship("TutorMessage", back_populates="user")
    learning_sessions = relationship("LearningSession", back_populates="user")
    diagnostic_results = relationship("DiagnosticResult", back_populates="user")


class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, index=True)
    level = Column(String)
    outline = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="courses")
    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan")
    learning_path = relationship("LearningPath", back_populates="course", uselist=False, cascade="all, delete-orphan")


class Module(Base):
    __tablename__ = "modules"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    order = Column(Integer)
    course_id = Column(Integer, ForeignKey("courses.id"))

    course = relationship("Course", back_populates="modules")
    topics = relationship("Topic", back_populates="module", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text)
    order = Column(Integer)
    is_completed = Column(Boolean, default=False)
    is_weak = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    module_id = Column(Integer, ForeignKey("modules.id"))

    module = relationship("Module", back_populates="topics")
    chat_messages = relationship("TutorMessage", back_populates="topic")


class DiagnosticResult(Base):
    __tablename__ = "diagnostic_results"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String)
    score = Column(Integer)
    total = Column(Integer)
    level = Column(String)
    weak_areas = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="diagnostic_results")


class TutorMessage(Base):
    __tablename__ = "tutor_messages"
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    user = relationship("User", back_populates="chat_messages")
    topic = relationship("Topic", back_populates="chat_messages")


class LearningPath(Base):
    __tablename__ = "learning_paths"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), unique=True)
    weeks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="learning_path")


class LearningSession(Base):
    __tablename__ = "learning_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    duration_seconds = Column(Integer, default=0)
    session_date = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="learning_sessions")


class Badge(Base):
    __tablename__ = "badges"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    name = Column(String)
    description = Column(String)
    icon = Column(String)
    xp_reward = Column(Integer, default=0)

    users = relationship("UserBadge", back_populates="badge")


class UserBadge(Base):
    __tablename__ = "user_badges"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    badge_id = Column(Integer, ForeignKey("badges.id"))
    earned_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="badges")
    badge = relationship("Badge", back_populates="users")

# backend/models.py

class ChatMessage(BaseModel): # or whatever base class you use
    id: int
    text: str
    # ... rest of your code