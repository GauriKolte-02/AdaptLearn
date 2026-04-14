from schemas import NPTELCourse
from typing import List

NPTEL_COURSES_DB = {
    "machine learning": [
        {"title": "Machine Learning", "url": "https://nptel.ac.in/courses/106106139", "instructor": "Prof. Balaraman Ravindran", "institute": "IIT Madras"},
        {"title": "Introduction to Machine Learning", "url": "https://nptel.ac.in/courses/106105152", "instructor": "Prof. Sudeshna Sarkar", "institute": "IIT Kharagpur"},
        {"title": "Deep Learning", "url": "https://nptel.ac.in/courses/106106184", "instructor": "Prof. Mitesh Khapra", "institute": "IIT Madras"},
    ],
    "python": [
        {"title": "Programming in Python", "url": "https://nptel.ac.in/courses/106106182", "instructor": "Prof. Ragunathan Rengasamy", "institute": "IIT Madras"},
        {"title": "Data Science with Python", "url": "https://nptel.ac.in/courses/106106212", "instructor": "Prof. Abinash Panda", "institute": "IIT Hyderabad"},
    ],
    "data science": [
        {"title": "Data Science for Engineers", "url": "https://nptel.ac.in/courses/106106179", "instructor": "Prof. Ragunathan Rengasamy", "institute": "IIT Madras"},
        {"title": "Introduction to Data Analytics", "url": "https://nptel.ac.in/courses/110105071", "instructor": "Prof. Nandan Sudarsanam", "institute": "IIT Madras"},
    ],
    "web development": [
        {"title": "Modern Application Development", "url": "https://nptel.ac.in/courses/106106216", "instructor": "Prof. Sudarshan Iyengar", "institute": "IIT Ropar"},
        {"title": "Database Management Systems", "url": "https://nptel.ac.in/courses/106106093", "instructor": "Prof. D. Janakiram", "institute": "IIT Madras"},
    ],
    "algorithms": [
        {"title": "Design and Analysis of Algorithms", "url": "https://nptel.ac.in/courses/106101060", "instructor": "Prof. Abhiram Ranade", "institute": "IIT Bombay"},
        {"title": "Data Structures and Algorithms", "url": "https://nptel.ac.in/courses/106104185", "instructor": "Prof. Naveen Garg", "institute": "IIT Delhi"},
    ],
}

DEFAULT_COURSES = [
    {"title": "Programming and Data Structures", "url": "https://nptel.ac.in/courses/106102064", "instructor": "Prof. P.P. Chakraborty", "institute": "IIT Kharagpur"},
    {"title": "Computer Networks", "url": "https://nptel.ac.in/courses/106105081", "instructor": "Prof. S. Ghosh", "institute": "IIT Kharagpur"},
]

async def get_nptel_courses(topic: str) -> List[NPTELCourse]:
    topic_lower = topic.lower()
    courses_data = []
    for key, courses in NPTEL_COURSES_DB.items():
        if key in topic_lower or topic_lower in key:
            courses_data = courses
            break
    if not courses_data:
        courses_data = DEFAULT_COURSES
    return [NPTELCourse(**c) for c in courses_data]
