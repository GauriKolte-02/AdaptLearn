from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import GamificationResponse
from routers.auth import get_current_user
from datetime import date
import json
from models import Badge, UserBadge # Adjust the path if your models are elsewhere
router = APIRouter()

BADGES = {
    "first_course":   {"id": "first_course",   "label": "First Course",    "desc": "Generated your first course",      "xp": 0},
    "first_complete": {"id": "first_complete",  "label": "Topic Master",    "desc": "Completed your first topic",        "xp": 10},
    "ten_topics":     {"id": "ten_topics",      "label": "Eager Learner",   "desc": "Completed 10 topics",               "xp": 50},
    "streak_3":       {"id": "streak_3",        "label": "On A Roll",       "desc": "3-day learning streak",             "xp": 100},
    "streak_7":       {"id": "streak_7",        "label": "Week Warrior",    "desc": "7-day learning streak",             "xp": 250},
    "xp_100":         {"id": "xp_100",          "label": "XP Collector",    "desc": "Earned 100 XP",                     "xp": 100},
    "xp_500":         {"id": "xp_500",          "label": "Knowledge Seeker","desc": "Earned 500 XP",                     "xp": 500},
    "three_courses":  {"id": "three_courses",   "label": "Course Hoarder",  "desc": "Created 3 courses",                 "xp": 150},
}

LEVEL_TITLES = [
    (0,    "Novice"),
    (100,  "Apprentice"),
    (300,  "Scholar"),
    (600,  "Expert"),
    (1000, "Master"),
    (2000, "Grandmaster"),
]

def get_level_title(xp: int) -> str:
    title = "Novice"
    for threshold, t in LEVEL_TITLES:
        if xp >= threshold:
            title = t
    return title


def update_streak(user: User, db: Session):
    today = date.today().isoformat()
    if user.last_activity_date == today:
        return  # Already updated today
    from datetime import date as dt, timedelta
    yesterday = (dt.today() - timedelta(days=1)).isoformat()
    if user.last_activity_date == yesterday:
        user.streak_days = (user.streak_days or 0) + 1
    else:
        user.streak_days = 1
    user.last_activity_date = today
    db.commit()

def check_and_award_badges(user: User, db: Session, completed_topics: int = 0, course_count: int = 0):
    # 1. Start with an empty list of "newly earned" keys for this session
    newly_earned = []

    # 2. Define the award helper (it just collects keys for now)
    def award(badge_id: str):
        # Check if the user ALREADY has this badge in the database relationship
        # to avoid awarding it twice
        if not any(ub.badge.key == badge_id for ub in user.badges):
            newly_earned.append(badge_id)

    # 3. Qualification Logic
    if course_count >= 1:
        award("first_course")
    if course_count >= 3:
        award("three_courses")
    if completed_topics >= 1:
        award("first_complete")
    if completed_topics >= 10:
        award("ten_topics")
    if (user.streak_days or 0) >= 3:
        award("streak_3")
    if (user.streak_days or 0) >= 7:
        award("streak_7")
    if (user.xp_points or 0) >= 100:
        award("xp_100")
    if (user.xp_points or 0) >= 500:
        award("xp_500")

    # 4. Save to Database (CRITICAL: This must be indented inside the function!)
    for badge_key in newly_earned:
        badge_def = db.query(Badge).filter(Badge.key == badge_key).first()
        if badge_def:
            # Create the link in your UserBadge association table
            new_link = UserBadge(user_id=user.id, badge_id=badge_def.id)
            db.add(new_link)
            # Add the reward points
            user.xp_points = (user.xp_points or 0) + badge_def.xp_reward
    
    # 5. Commit the changes
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error saving badges: {e}")



@router.get("/", response_model=GamificationResponse)
def get_gamification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_streak(current_user, db)

    from models import Course, Module, Topic
    from sqlalchemy.orm import joinedload
    courses = db.query(Course).options(
        joinedload(Course.modules).joinedload(Module.topics)
    ).filter(Course.user_id == current_user.id).all()

    completed = sum(
        1 for c in courses
        for m in c.modules
        for t in m.topics
        if t.is_completed
    )
    check_and_award_badges(current_user, db, completed_topics=completed, course_count=len(courses))

    try:
        badges = json.loads(current_user.badges or "[]")
    except Exception:
        badges = []

    xp = current_user.xp_points or 0
    # Find next badge not yet earned
    next_badge = None
    for bid, info in BADGES.items():
        if bid not in badges:
            next_badge = info["label"]
            break

    return GamificationResponse(
        xp_points=xp,
        streak_days=current_user.streak_days or 0,
        badges=badges,
        level_title=get_level_title(xp),
        next_badge=next_badge,
    )
async def award_xp_and_badges(user_id: int, action: str, db: Session):
    from models import User, Course, Module, Topic
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"newly_earned": []}
    current_xp = user.xp_points if user.xp_points is not None else 0
    user.xp_points = current_xp + 10
    print(f"DEBUG: Awarding 10 XP. New Total: {user.xp_points}")
    
    # 2. Run the badge check
    courses = db.query(Course).filter(Course.user_id == user_id).all()
    completed_count = db.query(Topic).join(Module).join(Course).filter(
        Course.user_id == user_id, 
        Topic.is_completed == True
    ).count()
    
    # Existing badge logic
    before_badges = json.loads(user.badges or "[]")
    check_and_award_badges(user, db, completed_topics=completed_count, course_count=len(courses))
    after_badges = json.loads(user.badges or "[]")
    
    new_badges = [b for b in after_badges if b not in before_badges]
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"newly_earned": new_badges}

@router.get("/badges/all")
def get_all_badges():
    return list(BADGES.values())
