"""Автономный сервер личного кабинета.

Запускается отдельно от приложения из папки «Генератор тестов».
Пароль передаётся только через переменную окружения и хранится в базе
исключительно в виде PBKDF2-хеша.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import os
import re
import secrets
import sqlite3
from contextlib import closing
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, Request, Response, status
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

try:
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import (
        DateRange,
        Dimension,
        Metric,
        MinuteRange,
        RunRealtimeReportRequest,
        RunReportRequest,
    )
    from google.oauth2 import service_account
except ImportError:  # pragma: no cover - dependency is installed from requirements.txt
    BetaAnalyticsDataClient = None
    DateRange = Dimension = Metric = MinuteRange = None
    RunRealtimeReportRequest = RunReportRequest = None
    service_account = None


BASE_DIR = Path(__file__).resolve().parent
LOGGER = logging.getLogger("personal_cabinet.ga4")


def load_local_env() -> None:
    for env_name in (".env", "alasster.env"):
        env_path = BASE_DIR / env_name
        if not env_path.is_file():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and value:
                os.environ.setdefault(key, value)


load_local_env()

DB_PATH = Path(os.environ.get("PERSONAL_CABINET_DB_PATH", BASE_DIR / "data" / "cabinet.sqlite3"))
SESSION_COOKIE = "personal_cabinet_session"
SESSION_TTL = 60 * 60 * 24 * 7
ONLINE_WINDOW = 60 * 5
GA4_PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "560432914").strip()
GA4_SERVICE_ACCOUNT_FILE = os.environ.get("GA4_SERVICE_ACCOUNT_FILE", "ga4-service-account.json").strip()
PBKDF2_ITERATIONS = 310_000
SUPERADMIN_EMAIL = os.environ.get("PERSONAL_CABINET_SUPERADMIN_EMAIL", "alasster@yandex.ru").strip().lower()
ALLOWED_ROLES = {"user", "teacher", "admin", "superadmin"}

app = FastAPI(title="Личный кабинет", docs_url=None, redoc_url=None)
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


@app.middleware("http")
async def security_headers(request: Request, call_next):
    # Исходные шаблоны хранятся на сервере и доступны только через
    # контролируемые маршруты /login, /register и /. Прямые обращения к
    # именам файлов не должны становиться альтернативным способом доступа.
    if request.url.path.lower().endswith(".html"):
        return Response(status_code=status.HTTP_404_NOT_FOUND)

    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; base-uri 'none'; object-src 'none'; "
        "frame-ancestors 'none'; form-action 'self'; script-src 'self'; "
        "style-src 'self' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; connect-src 'self'; "
        "img-src 'self' data:"
    )
    return response


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str


class ProfileUpdateRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    new_password: str = ""
    new_password_confirm: str = ""


class AdminPasswordResetRequest(BaseModel):
    new_password: str
    new_password_confirm: str


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
                expires_at INTEGER NOT NULL,
                last_seen INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
            );
            """
        )
        session_columns = {row["name"] for row in db.execute("PRAGMA table_info(sessions)").fetchall()}
        if "last_seen" not in session_columns:
            db.execute("ALTER TABLE sessions ADD COLUMN last_seen INTEGER NOT NULL DEFAULT 0")
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
        else:
            db.execute(
                "UPDATE sessions SET last_seen = strftime('%s', 'now') WHERE token_hash = ?",
                (token_digest(token),),
            )
            db.commit()
        return row


def page(filename: str) -> str:
    return (BASE_DIR / filename).read_text(encoding="utf-8")


def site_content_summary() -> dict:
    excluded = {"Генератор тестов", "Личный кабинет", "дизайн элементов"}
    class_rows = []
    for directory in sorted(BASE_DIR.parent.iterdir(), key=lambda item: item.name):
        if not directory.is_dir() or directory.name in excluded or directory.name.startswith("."):
            continue
        lesson_count = len(list(directory.rglob("*.html")))
        if lesson_count:
            class_rows.append({"name": directory.name, "lessons": lesson_count})
    return {
        "lessons": sum(row["lessons"] for row in class_rows),
        "classes": class_rows,
    }


def ga4_credentials_path() -> Path:
    path = Path(GA4_SERVICE_ACCOUNT_FILE)
    return path if path.is_absolute() else BASE_DIR / path


@lru_cache(maxsize=1)
def ga4_client():
    if BetaAnalyticsDataClient is None or service_account is None:
        raise RuntimeError("Пакет Google Analytics Data API не установлен")
    key_path = ga4_credentials_path()
    if not key_path.is_file():
        raise FileNotFoundError("Файл ключа Google Analytics не найден")
    credentials = service_account.Credentials.from_service_account_file(
        str(key_path),
        scopes=["https://www.googleapis.com/auth/analytics.readonly"],
    )
    return BetaAnalyticsDataClient(credentials=credentials)


def ga4_realtime_users() -> int:
    response = ga4_client().run_realtime_report(
        RunRealtimeReportRequest(
            property=f"properties/{GA4_PROPERTY_ID}",
            metrics=[Metric(name="activeUsers")],
            minute_ranges=[MinuteRange(start_minutes_ago=4)],
        ),
        timeout=10,
    )
    if not response.rows:
        return 0
    return int(response.rows[0].metric_values[0].value or 0)


def ga4_traffic(mode: str) -> list[dict]:
    dimension_name = "date" if mode == "daily" else "yearMonth"
    start_date = "30daysAgo" if mode == "daily" else "365daysAgo"
    response = ga4_client().run_report(
        RunReportRequest(
            property=f"properties/{GA4_PROPERTY_ID}",
            dimensions=[Dimension(name=dimension_name)],
            metrics=[Metric(name="activeUsers")],
            date_ranges=[DateRange(start_date=start_date, end_date="today")],
        ),
        timeout=10,
    )
    points = []
    for row in response.rows:
        key = row.dimension_values[0].value
        if mode == "daily" and len(key) == 8:
            label = f"{key[:4]}-{key[4:6]}-{key[6:]}"
        elif mode == "monthly" and len(key) == 6:
            label = f"{key[:4]}-{key[4:]}"
        else:
            label = key
        points.append({"key": key, "label": label, "value": int(row.metric_values[0].value or 0)})
    return sorted(points, key=lambda item: item["key"])


def ga4_summary() -> dict:
    result = {"online_users": None, "traffic": {"daily": [], "monthly": []}, "available": False}
    try:
        result["online_users"] = ga4_realtime_users()
        result["available"] = True
    except Exception:
        LOGGER.exception("Не удалось получить realtime-данные GA4")
    for mode in ("daily", "monthly"):
        try:
            result["traffic"][mode] = ga4_traffic(mode)
            result["available"] = True
        except Exception:
            LOGGER.exception("Не удалось получить график GA4: %s", mode)
    return result


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
    return page("auth.html")


@app.get("/register", response_class=HTMLResponse)
def register_page(request: Request):
    if get_user_from_request(request) is not None:
        return RedirectResponse("/", status_code=status.HTTP_303_SEE_OTHER)
    return page("auth.html")


@app.get("/api/me")
def current_user(request: Request):
    user = get_user_from_request(request)
    if user is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)
    return dict(user)


@app.patch("/api/me")
def update_current_user(payload: ProfileUpdateRequest, request: Request):
    user = get_user_from_request(request)
    if user is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)

    first_name = payload.first_name.strip()
    last_name = payload.last_name.strip()
    email = payload.email.strip().lower()
    new_password = payload.new_password

    if not first_name or not last_name:
        return JSONResponse({"detail": "Введите имя и фамилию"}, status_code=400)
    if len(first_name) > 80 or len(last_name) > 80:
        return JSONResponse({"detail": "Имя и фамилия слишком длинные"}, status_code=400)
    if not EMAIL_PATTERN.fullmatch(email):
        return JSONResponse({"detail": "Введите корректный email"}, status_code=400)
    if new_password and len(new_password) < 8:
        return JSONResponse({"detail": "Новый пароль должен содержать минимум 8 символов"}, status_code=400)
    if new_password != payload.new_password_confirm:
        return JSONResponse({"detail": "Пароли не совпадают"}, status_code=400)

    display_name = f"{first_name} {last_name}"
    with closing(open_db()) as db:
        duplicate = db.execute(
            "SELECT id FROM users WHERE username = ? AND id != ?",
            (email, user["id"]),
        ).fetchone()
        if duplicate is not None:
            return JSONResponse({"detail": "Пользователь с таким email уже зарегистрирован"}, status_code=409)
        if new_password:
            db.execute(
                "UPDATE users SET username = ?, display_name = ?, first_name = ?, last_name = ?, password_hash = ? WHERE id = ?",
                (email, display_name, first_name, last_name, hash_password(new_password), user["id"]),
            )
        else:
            db.execute(
                "UPDATE users SET username = ?, display_name = ?, first_name = ?, last_name = ? WHERE id = ?",
                (email, display_name, first_name, last_name, user["id"]),
            )
        db.commit()
        updated = db.execute(
            "SELECT id, username, display_name, first_name, last_name, role FROM users WHERE id = ?",
            (user["id"],),
        ).fetchone()
    return dict(updated)


@app.get("/api/site-overview")
def site_overview(request: Request):
    user = get_user_from_request(request)
    if user is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)
    with closing(open_db()) as db:
        users_count = db.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
        cabinet_online_users = db.execute(
            """
            SELECT COUNT(DISTINCT user_id) AS count
            FROM sessions
            WHERE expires_at > strftime('%s', 'now')
              AND last_seen >= strftime('%s', 'now') - ?
            """,
            (ONLINE_WINDOW,),
        ).fetchone()["count"]
    content = site_content_summary()
    analytics = ga4_summary()
    return {
        "site": "alasster.site",
        "lessons": content["lessons"],
        "classes": content["classes"],
        "users": users_count,
        "cabinet_online_users": cabinet_online_users,
        "online_users": analytics["online_users"],
        "analytics_available": analytics["available"],
        "traffic": analytics["traffic"],
    }


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
            "INSERT INTO sessions (token_hash, user_id, expires_at, last_seen) VALUES (?, ?, strftime('%s', 'now') + ?, strftime('%s', 'now'))",
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
            "SELECT id, first_name, last_name, username, display_name, role, created_at FROM users WHERE id != ? ORDER BY id",
            (access["id"],),
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


@app.post("/api/users/{user_id}/password")
def reset_user_password(user_id: int, payload: AdminPasswordResetRequest, request: Request):
    access = require_superadmin(request)
    if isinstance(access, JSONResponse):
        return access
    if user_id == access["id"]:
        return JSONResponse({"detail": "Для своего пароля используйте раздел профиля"}, status_code=400)
    if len(payload.new_password) < 8:
        return JSONResponse({"detail": "Пароль должен содержать минимум 8 символов"}, status_code=400)
    if payload.new_password != payload.new_password_confirm:
        return JSONResponse({"detail": "Пароли не совпадают"}, status_code=400)

    with closing(open_db()) as db:
        cursor = db.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (hash_password(payload.new_password), user_id),
        )
        db.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
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
