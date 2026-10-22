"""Автономный сервер личного кабинета.

Запускается отдельно от приложения из папки «Генератор тестов».
Пароль передаётся только через переменную окружения и хранится в базе
исключительно в виде PBKDF2-хеша.
"""

from __future__ import annotations

import hashlib
import hmac
import os
import re
import secrets
import sqlite3
from contextlib import closing
from pathlib import Path

from fastapi import FastAPI, Request, Response, status
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("PERSONAL_CABINET_DB_PATH", BASE_DIR / "data" / "cabinet.sqlite3"))
SESSION_COOKIE = "personal_cabinet_session"
SESSION_TTL = 60 * 60 * 24 * 7
PBKDF2_ITERATIONS = 310_000
SUPERADMIN_EMAIL = os.environ.get("PERSONAL_CABINET_SUPERADMIN_EMAIL", "alasster@yandex.ru").strip().lower()
ALLOWED_ROLES = {"user", "teacher", "admin", "superadmin"}

app = FastAPI(title="Личный кабинет", docs_url=None, redoc_url=None)
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def open_db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"{salt.hex()}:{digest.hex()}"


def verify_password(password: str, encoded_hash: str) -> bool:
    try:
        salt_hex, expected_hex = encoded_hash.split(":", 1)
        salt = bytes.fromhex(salt_hex)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
        return hmac.compare_digest(actual.hex(), expected_hex)
    except (ValueError, TypeError):
        return False


def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def init_db() -> None:
    with closing(open_db()) as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                display_name TEXT NOT NULL,
                first_name TEXT NOT NULL DEFAULT '',
                last_name TEXT NOT NULL DEFAULT '',
                role TEXT NOT NULL DEFAULT 'user',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at INTEGER NOT NULL
            );
            """
        )
        columns = {row["name"] for row in db.execute("PRAGMA table_info(users)").fetchall()}
        for column, definition in (("first_name", "TEXT NOT NULL DEFAULT ''"), ("last_name", "TEXT NOT NULL DEFAULT ''"), ("role", "TEXT NOT NULL DEFAULT 'user'")):
            if column not in columns:
                db.execute(f"ALTER TABLE users ADD COLUMN {column} {definition}")
        db.execute("UPDATE users SET role = 'superadmin' WHERE lower(username) = ?", (SUPERADMIN_EMAIL,))
        db.commit()

        username = os.environ.get("PERSONAL_CABINET_ADMIN_USERNAME", "").strip()
        password = os.environ.get("PERSONAL_CABINET_ADMIN_PASSWORD", "")
        if not username or not password:
            return

        existing = db.execute("SELECT id FROM users LIMIT 1").fetchone()
        if existing is None:
            display_name = os.environ.get("PERSONAL_CABINET_ADMIN_NAME", username).strip() or username
            db.execute(
                "INSERT INTO users (username, password_hash, display_name, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)",
                (username.lower(), hash_password(password), display_name, "", "", "superadmin"),
            )
            db.commit()


def get_user_from_request(request: Request) -> sqlite3.Row | None:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None

    with closing(open_db()) as db:
        row = db.execute(
            """
            SELECT users.id, users.username, users.display_name, users.first_name, users.last_name, users.role
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ? AND sessions.expires_at > strftime('%s', 'now')
            """,
            (token_digest(token),),
        ).fetchone()
        if row is None:
            db.execute("DELETE FROM sessions WHERE token_hash = ?", (token_digest(token),))
            db.commit()
        return row


def page(filename: str) -> str:
    return (BASE_DIR / filename).read_text(encoding="utf-8")


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/", response_class=HTMLResponse)
def dashboard(request: Request):
    if get_user_from_request(request) is None:
        return RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)
    return page("dashboard.html")


@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    if get_user_from_request(request) is not None:
        return RedirectResponse("/", status_code=status.HTTP_303_SEE_OTHER)
    return page("login.html")


@app.get("/register", response_class=HTMLResponse)
def register_page(request: Request):
    if get_user_from_request(request) is not None:
        return RedirectResponse("/", status_code=status.HTTP_303_SEE_OTHER)
    return page("register.html")


@app.get("/api/me")
def current_user(request: Request):
    user = get_user_from_request(request)
    if user is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)
    return dict(user)


@app.post("/api/login")
def login(payload: LoginRequest, response: Response):
    email = payload.username.strip().lower()
    with closing(open_db()) as db:
        user = db.execute(
            "SELECT id, username, display_name, password_hash, role FROM users WHERE username = ?",
            (email,),
        ).fetchone()

        if user is None or not verify_password(payload.password, user["password_hash"]):
            return JSONResponse(
                {"detail": "Неверное имя пользователя или пароль"},
                status_code=401,
            )

        token = secrets.token_urlsafe(32)
        db.execute(
            "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, strftime('%s', 'now') + ?)",
            (token_digest(token), user["id"], SESSION_TTL),
        )
        db.commit()

    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_TTL,
        httponly=True,
        samesite="lax",
        secure=os.environ.get("PERSONAL_CABINET_SECURE_COOKIE", "0") == "1",
    )
    return {"ok": True, "user": {"username": user["username"], "display_name": user["display_name"], "role": user["role"]}}


@app.post("/api/register")
def register(payload: RegisterRequest):
    first_name = payload.first_name.strip()
    last_name = payload.last_name.strip()
    email = payload.email.strip().lower()
    password = payload.password

    if not first_name or not last_name:
        return JSONResponse({"detail": "Введите имя и фамилию"}, status_code=400)
    if len(first_name) > 80 or len(last_name) > 80:
        return JSONResponse({"detail": "Имя и фамилия слишком длинные"}, status_code=400)
    if not EMAIL_PATTERN.fullmatch(email):
        return JSONResponse({"detail": "Введите корректный email"}, status_code=400)
    if len(password) < 8:
        return JSONResponse({"detail": "Пароль должен содержать минимум 8 символов"}, status_code=400)

    display_name = f"{first_name} {last_name}"
    role = "superadmin" if email == SUPERADMIN_EMAIL else "user"
    with closing(open_db()) as db:
        try:
            db.execute(
                """
                INSERT INTO users (username, password_hash, display_name, first_name, last_name, role)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (email, hash_password(password), display_name, first_name, last_name, role),
            )
            db.commit()
        except sqlite3.IntegrityError:
            return JSONResponse({"detail": "Пользователь с таким email уже зарегистрирован"}, status_code=409)

    return {"ok": True}


def require_superadmin(request: Request) -> sqlite3.Row | JSONResponse:
    user = get_user_from_request(request)
    if user is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)
    if user["role"] != "superadmin":
        return JSONResponse({"detail": "Недостаточно прав"}, status_code=403)
    return user


@app.get("/api/users")
def list_users(request: Request):
    access = require_superadmin(request)
    if isinstance(access, JSONResponse):
        return access
    with closing(open_db()) as db:
        rows = db.execute(
            "SELECT id, first_name, last_name, username, display_name, role, created_at FROM users ORDER BY id"
        ).fetchall()
    return {"users": [dict(row) for row in rows]}


@app.patch("/api/users/{user_id}/role")
def update_user_role(user_id: int, payload: dict, request: Request):
    access = require_superadmin(request)
    if isinstance(access, JSONResponse):
        return access
    role = str(payload.get("role", "")).strip().lower()
    if role not in ALLOWED_ROLES:
        return JSONResponse({"detail": "Недопустимая роль"}, status_code=400)
    if user_id == access["id"] and role != "superadmin":
        return JSONResponse({"detail": "Нельзя снять роль с текущего супер-админа"}, status_code=400)
    with closing(open_db()) as db:
        cursor = db.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
        db.commit()
    if cursor.rowcount == 0:
        return JSONResponse({"detail": "Пользователь не найден"}, status_code=404)
    return {"ok": True}


@app.post("/api/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        with closing(open_db()) as db:
            db.execute("DELETE FROM sessions WHERE token_hash = ?", (token_digest(token),))
            db.commit()
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True}


@app.get("/health")
def health():
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host=os.environ.get("PERSONAL_CABINET_HOST", "127.0.0.1"), port=int(os.environ.get("PERSONAL_CABINET_PORT", "8010")), reload=False)
