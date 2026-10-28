STUDENT_TOKEN_DB_MAP: dict[str, str] = {}

def register_student_token_db(token: str, db_path: str) -> None:
    STUDENT_TOKEN_DB_MAP[token] = db_path

import hashlib
import hmac
import secrets
import os
from typing import Optional
from fastapi import Request, HTTPException, status, Depends
from database import get_db

SECRET_KEY = os.environ.get("BAGALAU_SECRET_KEY", secrets.token_hex(32))

def hash_password(password: str, salt: Optional[str] = None) -> str:
    if salt is None:
        salt = secrets.token_hex(16)
    iterations = 100_000
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"{salt}:{dk.hex()}"

def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        salt, expected_hex = password_hash.split(":")
        iterations = 100_000
        dk = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), iterations)
        return hmac.compare_digest(dk.hex(), expected_hex)
    except Exception:
        return False

# Teacher Sessions
TEACHER_SESSIONS = {}  # token -> teacher_id

def create_teacher_session(teacher_id: str) -> str:
    token = secrets.token_urlsafe(32)
    TEACHER_SESSIONS[token] = teacher_id
    return token

def destroy_teacher_session(token: str):
    TEACHER_SESSIONS.pop(token, None)

async def get_current_teacher(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    if not token:
        token = request.cookies.get("bagalau_teacher_session")
    
    if not token or token not in TEACHER_SESSIONS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется авторизация учителя",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    teacher_id = TEACHER_SESSIONS[token]
    async with get_db() as db:
        cursor = await db.execute("SELECT id, username, full_name, created_at FROM teachers WHERE id = ?", (teacher_id,))
        teacher = await cursor.fetchone()
        if not teacher:
            TEACHER_SESSIONS.pop(token, None)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Учитель не найден")
        return dict(teacher)

async def get_current_student_attempt(request: Request) -> dict:
    auth_header = request.headers.get("X-Attempt-Token")
    token = auth_header
    if not token:
        token = request.cookies.get("bagalau_student_token")
    if not token:
        token = request.query_params.get("token")
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Сессия ученика не найдена. Пожалуйста, войдите в работу снова.",
        )

    db_path = STUDENT_TOKEN_DB_MAP.get(token)
    if not db_path:
        try:
            from database import DB_PATH
            async with get_db(DB_PATH) as central_db:
                cursor = await central_db.execute(
                    "SELECT db_path FROM student_tokens_registry WHERE token = ?",
                    (token,)
                )
                row = await cursor.fetchone()
                if row and row["db_path"] and os.path.exists(row["db_path"]):
                    db_path = row["db_path"]
                    STUDENT_TOKEN_DB_MAP[token] = db_path
        except Exception:
            pass
    if db_path:
        from database import set_current_db_path
        set_current_db_path(db_path)

    async with get_db(db_path) as db:
        cursor = await db.execute("""
            SELECT sa.*, l.status as launch_status, l.duration_minutes, l.title as launch_title,
                   l.shuffle_questions, l.shuffle_options, l.allow_back_nav, l.show_all_at_once,
                   CASE WHEN sa.publish_results_override IS NULL THEN l.publish_scores ELSE sa.publish_results_override END AS publish_scores,
                   CASE WHEN sa.publish_results_override IS NULL THEN l.publish_answers ELSE sa.publish_results_override END AS publish_answers,
                   CASE WHEN sa.publish_results_override IS NULL THEN l.publish_comments ELSE sa.publish_results_override END AS publish_comments,
                   l.timezone,
                   l.bg_color, l.bg_color_v1, l.bg_color_v2, l.snapshot_tasks_json
            FROM student_attempts sa
            JOIN launches l ON sa.launch_id = l.id
            WHERE sa.attempt_token = ? AND sa.status != 'removed'
        """, (token,))
        attempt = await cursor.fetchone()
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Недействительный токен попытки",
            )
        return dict(attempt)
