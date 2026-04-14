import os
import json
import re
from groq import Groq
from schemas import DiagnosticQuestion
from typing import List
from dotenv import load_dotenv

load_dotenv()

_client = None

def get_client():
    global _client
    if _client is None:
        key = os.getenv("GROQ_API_KEY", "").strip() # .strip() removes accidental spaces
        if not key:
            print("❌ WARNING: GROQ_API_KEY is missing from .env!")
            return None
        
        try:
            _client = Groq(api_key=key)
            print("✅ Groq Client initialized successfully.")
        except Exception as e:
            print(f"❌ Failed to initialize Groq: {e}")
            _client = None
            
    return _client


def _parse_json(text: str, kind: str):
    """Clean and extract JSON from AI response without complex regex errors."""
    # 1. Basic cleaning
    text = text.strip()
    
    # 2. Remove markdown fences (the ```json and ``` parts)
    text = text.replace("```json", "").replace("```", "").strip()
    
    # 3. Remove hidden control characters that break json.loads
    # This keeps only normal text, newlines, and tabs
    text = "".join(char for char in text if ord(char) >= 32 or char in "\n\r\t")

    try:
        if kind == "array":
            # Find the first '[' and the last ']'
            start = text.find('[')
            end = text.rfind(']') + 1
            if start > -1:
                return json.loads(text[start:end])
        else:
            # Find the first '{' and the last '}'
            start = text.find('{')
            end = text.rfind('}') + 1
            if start > -1:
                return json.loads(text[start:end])
    except Exception as e:
        print(f"[groq] JSON Parsing failed: {e}")
    
    return None


# ── Diagnostic questions ──────────────────────────────────────────────────────
async def generate_diagnostic_questions(topic: str) -> List[DiagnosticQuestion]:
    client = get_client()
    prompt = f"""Generate exactly 5 multiple-choice questions to assess knowledge about "{topic}".
Return ONLY a valid JSON array — no extra text, no markdown fences:
[
  {{
    "id": 1,
    "question": "Question text?",
    "options": ["A", "B", "C", "D"],
    "correct_answer": 0
  }}
]
Where correct_answer is the 0-based index of the correct option.
Make questions progressively harder (Q1 = easy, Q5 = hard)."""

    if client:
        try:
            resp = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2000,
            )
            data = _parse_json(resp.choices[0].message.content, "array")
            if data:
                return [DiagnosticQuestion(**q) for q in data]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Groq Error: {str(e)}")

    # ── Fallback ──
    return [
        DiagnosticQuestion(id=i + 1,
            question=f"Sample question {i+1} about {topic}?",
            options=["Option A", "Option B", "Option C", "Option D"],
            correct_answer=i % 4)
        for i in range(5)
    ]


# ── Course generation ─────────────────────────────────────────────────────────
async def generate_course_content(topic: str, level: str) -> dict:
    client = get_client()
    
    # 1. Check if client exists
    if not client:
        print("[groq] ERROR: Client is None. Check your GROQ_API_KEY in .env")
        return _fallback_course(topic, level)

    prompt = f"""Create a highly detailed, academic {level}-level course for "{topic}".
Return ONLY a valid JSON object — no extra text:
{{
  "outline": ["Module 1: ...", "Module 2: ...", "Module 3: ...", "Module 4: ...", "Module 5: ..."],
  "modules": [
    {{
      "title": "Module 1: ...",
      "topics": [
        {{
          "title": "1.1 ...",
          "content": "# Markdown Heading\\n\\nExtremely detailed theory...\\n\\n### Core Concepts\\nDetailed explanation...\\n\\n### Examples\\nCode or practical examples..."
        }}
      ]
    }}
  ]
}}
Requirements:
- Exactly 5 modules with 2-3 topics each.
- CRITICAL: Each "content" field must be a deep-dive lesson (minimum 400 words per topic).
- Include comprehensive theory, sub-headings, and technical explanations for every topic.
- Do not provide summaries; provide full instructional material.
- Tailor difficulty to {level} level."""

    try:
        print(f"[groq] Requesting AI content for: {topic}...")
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4, # Lower temperature = more stable JSON
            max_tokens=6000, 
        )
        
        raw_content = resp.choices[0].message.content
        
        # 2. Parse JSON
        data = _parse_json(raw_content, "object")
        
        if data and data.get("modules"):
            print("✅ AI Content Generated Successfully!")
            return data
        else:
            print("[groq] ERROR: JSON parsed but 'modules' key is missing.")
            
    except Exception as e:
        # 3. Check for specific API errors (401, 429, etc.)
        print(f"[groq] API CALL ERROR: {e}")

    # ── Fallback ──
    print("[groq] Falling back to template content...")
    return _fallback_course(topic, level)


# ── Roadmap generation ────────────────────────────────────────────────────────
async def generate_roadmap(topic: str, level: str) -> list:
    client = get_client()
    prompt = f"""Create a 4-week personalized learning roadmap for "{topic}" at {level} level.
Return ONLY a valid JSON array — no extra text:
[
  {{
    "week": 1,
    "title": "Week 1: Foundations",
    "focus": "One-line description of the week's focus",
    "tasks": ["Task 1", "Task 2", "Task 3"]
  }}
]
Make 4 week objects. Progressively increase difficulty week by week."""

    if client:
        try:
            resp = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=1500,
            )
            data = _parse_json(resp.choices[0].message.content, "array")
            if data:
                return data
        except Exception as e:
            print(f"[groq] roadmap error: {e}")

    return [
        {"week": 1, "title": "Week 1: Foundations", "focus": f"Core concepts of {topic}", "tasks": ["Read introductory material", "Complete Module 1", "Take notes"]},
        {"week": 2, "title": "Week 2: Core Concepts", "focus": "Deeper understanding", "tasks": ["Complete Modules 2–3", "Practice exercises", "Review weak areas"]},
        {"week": 3, "title": "Week 3: Practice", "focus": "Hands-on application", "tasks": ["Work on projects", "Complete quizzes", "Revise notes"]},
        {"week": 4, "title": "Week 4: Advanced Topics", "focus": "Master advanced concepts", "tasks": ["Complete remaining modules", "Final review", "Self-assessment quiz"]},
    ]


# ── AI Tutor chat ─────────────────────────────────────────────────────────────
async def ai_tutor_chat(message: str, history: list, topic_title: str = None, topic_content: str = None) -> str:
    client = get_client()

    system = """You are an expert AI tutor helping a student learn. 
Be concise, clear, and encouraging. Use examples where helpful.
If given topic context, answer specifically about that topic.
Format your response with markdown when it helps clarity."""

    if topic_title:
        system += f"\n\nCurrent lesson topic: {topic_title}"
    if topic_content:
        system += f"\n\nLesson content summary (first 600 chars):\n{topic_content[:600]}"

    messages = [{"role": "system", "content": system}] + history + [{"role": "user", "content": message}]

    if client:
        try:
            resp = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.6,
                max_tokens=800,
            )
            return resp.choices[0].message.content
        except Exception as e:
            print(f"[groq] tutor error: {e}")

    return (
        f"I'd be happy to help with your question about **{topic_title or 'this topic'}**! "
        "However, the AI tutor requires a valid Groq API key to function. "
        "Please add your `GROQ_API_KEY` to the backend `.env` file and restart the server."
    )


# ── Helpers ───────────────────────────────────────────────────────────────────
def _fallback_course(topic: str, level: str) -> dict:
    modules = []
    for i in range(1, 6):
        modules.append({
            "title": f"Module {i}: {topic} — Part {i}",
            "topics": [
                {
                    "title": f"{i}.1 Introduction to Concept {i}",
                    "content": (
                        f"# {topic} — Module {i}\n\n"
                        f"This module covers essential concepts at the **{level}** level.\n\n"
                        "## Learning Objectives\n\n"
                        "- Understand the core principles\n"
                        "- Apply concepts in practice\n"
                        "- Build on previous knowledge\n\n"
                        "## Overview\n\n"
                        f"Add your `GROQ_API_KEY` to `.env` to get fully AI-generated content tailored to {level} learners.\n\n"
                        "## Key Concepts\n\n"
                        "1. **Fundamentals** — The building blocks\n"
                        "2. **Methods** — Common techniques used\n"
                        "3. **Applications** — Real-world use cases\n\n"
                        "> 💡 Tip: Take notes while reading to reinforce learning."
                    ),
                },
                {
                    "title": f"{i}.2 Practical Examples",
                    "content": (
                        f"# Practical Examples — Module {i}\n\n"
                        "## Example Walkthrough\n\n"
                        "```python\n# Example code here\nprint('Hello, learner!')\n```\n\n"
                        "## Summary\n\nThis topic provides hands-on examples to solidify understanding."
                    ),
                },
            ],
        })
    return {
        "outline": [f"Module {i}: {topic} — Part {i}" for i in range(1, 6)],
        "modules": modules,
    }
