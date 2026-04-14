import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List
from dotenv import load_dotenv


load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)


def _send(to: str, subject: str, html: str):
    """Send an HTML email. Silently no-ops if SMTP is not configured."""
    if not SMTP_USER or not SMTP_PASS:
        print(f"[email] SMTP not configured — skipping email to {to}")
        print(f"[email] Subject: {subject}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"AdaptLearn <{FROM_EMAIL}>"
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, to, msg.as_string())
        print(f"[email] Sent '{subject}' to {to}")
    except Exception as e:
        print(f"[email] Failed to send email: {e}")


def send_progress_email(email: str, username: str, courses: List[dict], xp: int):
    rows = "".join(
        f"<tr><td style='padding:8px 12px;border-bottom:1px solid #1a1a2e'>{c['topic']}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #1a1a2e;color:#818cf8'>{c['progress']}</td></tr>"
        for c in courses
    )
    html = f"""
    <div style="background:#08080f;color:#fff;font-family:'DM Sans',sans-serif;max-width:600px;margin:auto;padding:32px;border-radius:16px;border:1px solid #1a1a2e">
      <h1 style="color:#818cf8;font-family:monospace">📊 Your Weekly Progress</h1>
      <p>Hi <strong>{username}</strong>! Here's your learning summary for this week.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#0f0f1a;border-radius:8px;overflow:hidden">
        <thead><tr style="background:#1a1a2e">
          <th style="padding:10px 12px;text-align:left;color:#818cf8">Course</th>
          <th style="padding:10px 12px;text-align:left;color:#818cf8">Progress</th>
        </tr></thead>
        <tbody>{rows}</tbody>
      </table>
      <p style="background:#1a1a2e;padding:12px 16px;border-radius:8px;border-left:3px solid #6366f1">
        ⚡ Total XP earned: <strong style="color:#818cf8">{xp} XP</strong>
      </p>
      <p style="color:#ffffff60;font-size:13px">Keep up the great work! Log in to continue your learning journey.</p>
    </div>"""
    _send(email, "📊 Your Weekly Learning Progress — AdaptLearn", html)


def send_reminder_email(email: str, username: str, pending_topics: List[dict]):
    items = "".join(
        f"<li style='margin:6px 0'><span style='color:#818cf8'>{p['course']}</span> → {p['topic']}</li>"
        for p in pending_topics
    )
    html = f"""
    <div style="background:#08080f;color:#fff;font-family:'DM Sans',sans-serif;max-width:600px;margin:auto;padding:32px;border-radius:16px;border:1px solid #1a1a2e">
      <h1 style="color:#818cf8;font-family:monospace">⏰ Time to Learn!</h1>
      <p>Hi <strong>{username}</strong>! You have pending lessons waiting for you.</p>
      <ul style="background:#0f0f1a;padding:16px 24px;border-radius:8px;list-style:none">{items}</ul>
      <p style="color:#ffffff60;font-size:13px">Don't break your streak! Every topic completed earns you XP.</p>
    </div>"""
    _send(email, "⏰ Don't forget your lessons — AdaptLearn", html)


# --- NEW FUNCTIONS ADDED BELOW ---

def send_welcome_email(email: str, username: str, course_name: str):
    """Triggered when a user joins a new course."""
    html = f"""
    <div style="background:#08080f;color:#fff;font-family:'DM Sans',sans-serif;max-width:600px;margin:auto;padding:32px;border-radius:16px;border:1px solid #1a1a2e">
      <h1 style="color:#818cf8;font-family:monospace">🚀 Welcome to the Course!</h1>
      <p>Hi <strong>{username}</strong>! You've successfully enrolled in <strong>{course_name}</strong>.</p>
      <div style="background:#0f0f1a;padding:16px;border-radius:8px;margin:16px 0;border:1px dashed #818cf860">
        <p style="margin:0;font-size:14px;color:#ffffff90">
          Your adaptive learning path is being generated. Get ready to dive into technical modules tailored to your performance.
        </p>
      </div>
      <p>Log in now to begin your first lesson and earn your first points!</p>
      <p style="color:#ffffff60;font-size:13px;margin-top:24px">Happy Learning,<br/>The AdaptLearn Team</p>
    </div>"""
    _send(email, f"Enrolled: {course_name} — AdaptLearn", html)


def send_course_completion_email(email: str, username: str, course_name: str, final_xp: int):
    """Triggered when course progress hits 100%."""
    html = f"""
    <div style="background:#08080f;color:#fff;font-family:'DM Sans',sans-serif;max-width:600px;margin:auto;padding:32px;border-radius:16px;border:1px solid #818cf840">
      <h1 style="color:#10b981;font-family:monospace">🎓 Course Completed!</h1>
      <p>Outstanding work, <strong>{username}</strong>! You've officially finished <strong>{course_name}</strong>.</p>
      <div style="background:#0f0f1a;padding:24px;border-radius:12px;text-align:center;margin:20px 0;border:1px solid #1a1a2e">
        <h2 style="margin:0;color:#818cf8;font-size:16px;text-transform:uppercase">Final Score</h2>
        <div style="font-size:36px;font-weight:bold;color:#fff;margin:8px 0">{final_xp} XP</div>
        <p style="color:#ffffff60;font-size:14px;margin:0">Engineering Milestone Reached</p>
      </div>
      <p>Your analytics dashboard has been updated with your new skills. Check out your next recommended course!</p>
      <p style="color:#ffffff60;font-size:13px;margin-top:24px;text-align:center">The AdaptLearn Team</p>
    </div>"""
    _send(email, f"Congratulations on completing {course_name}!", html)

