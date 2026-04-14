# Adaptive Learning Course Generator

An AI-powered adaptive learning platform that generates personalized courses based on a diagnostic test.

## Features

- **User Authentication** — Register/login with JWT tokens
- **Diagnostic Test** — AI-generated MCQs to assess knowledge level
- **Adaptive Course Generation** — Personalized Beginner/Intermediate/Advanced courses via Groq API
- **3-Panel Course Viewer** — Outline, content, and resources side-by-side
- **Progress Tracking** — Mark topics as completed
- **YouTube Resources** — Relevant videos fetched per topic
- **NPTEL Courses** — Curated IIT/IISc course links
- **Search** — Filter topics within the course outline
- **Dark mode UI** — Sleek dark design throughout

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | FastAPI (Python) |
| Database | SQLite (via SQLAlchemy) |
| AI | Groq API (llama3-70b-8192) |
| Videos | YouTube Data API v3 |

---

## Project Structure

```
adaptive-learning/
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── database.py           # SQLite connection
│   ├── models.py             # SQLAlchemy models
│   ├── schemas.py            # Pydantic schemas
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/
│   │   ├── auth.py           # Register/Login/JWT
│   │   ├── course.py         # Course CRUD + resources
│   │   └── diagnostic.py     # Test generation + scoring
│   └── services/
│       ├── groq_service.py   # AI question/course generation
│       ├── youtube_service.py # YouTube API integration
│       └── nptel_service.py  # NPTEL course catalog
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── api.js            # Axios instance
        ├── context/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── AuthPage.jsx
        │   ├── DashboardPage.jsx
        │   └── CoursePage.jsx
        └── components/
            ├── TopicInput.jsx
            ├── DiagnosticTest.jsx
            ├── CourseOutline.jsx
            ├── ContentViewer.jsx
            └── ResourcePanel.jsx
```

---

## Setup Instructions

### 1. Get API Keys

**Groq API Key** (required for AI features):
- Go to https://console.groq.com
- Create an account and generate an API key

**YouTube Data API Key** (optional, falls back gracefully):
- Go to https://console.cloud.google.com
- Create a project → Enable "YouTube Data API v3"
- Create credentials → API Key

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
# OR
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API keys:
#   GROQ_API_KEY=gsk_xxxxx
#   YOUTUBE_API_KEY=AIzaxxx

# Run the server
uvicorn main:app --reload
```

Backend will run at: http://localhost:8000
API docs available at: http://localhost:8000/docs

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend will run at: http://localhost:5173

---

## Application Flow

```
1. Register / Login
        ↓
2. Enter Topic (e.g. "Machine Learning")
        ↓
3. Diagnostic Test (5 AI-generated MCQs)
        ↓
4. Score Evaluation:
   0–3/5  → Beginner
   4–7/10 → Intermediate
   8–10/10 → Advanced
        ↓
5. AI generates personalized course (5 modules, 2–3 topics each)
        ↓
6. 3-Panel Course Viewer:
   LEFT   → Course outline + search + progress
   CENTER → Markdown content for selected topic
   RIGHT  → YouTube videos + NPTEL courses
```

---

## Scoring Logic

The diagnostic score is normalized to a 0–10 scale:
- `normalized = (correct / total) * 10`
- **0–3** → Beginner
- **4–7** → Intermediate
- **8–10** → Advanced

---

## Notes

- The app works even without API keys — it uses fallback questions and course content
- All generated courses are saved to SQLite database
- Progress is persisted per topic (mark complete/incomplete)
- JWT tokens are stored in localStorage and expire after 7 days
