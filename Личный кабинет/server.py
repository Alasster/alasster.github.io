"""Автономный сервер личного кабинета.

Запускается отдельно от приложения из папки «Генератор тестов».
Пароль передаётся только через переменную окружения и хранится в базе
исключительно в виде PBKDF2-хеша.
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
from html import unescape
import importlib.util
import logging
import os
import re
import secrets
import sqlite3
import sys
import uuid
from contextlib import closing
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote

from fastapi import FastAPI, HTTPException, Request, Response, status, UploadFile, File, Form
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
GENERATOR_DIR = BASE_DIR / "generator"
GENERATOR_DATA_DIR = GENERATOR_DIR / "data"
# Materials directory located on Google Drive OUTSIDE the git repository
drive_root = BASE_DIR.parent.parent
if (drive_root / "alasster.github.io").exists():
    MATERIALS_DIR = drive_root / "Мои материалы"
else:
    MATERIALS_DIR = Path("G:/Мой диск/Мои материалы")
MATERIALS_DIR.mkdir(parents=True, exist_ok=True)
(MATERIALS_DIR / "Общие").mkdir(parents=True, exist_ok=True)
LOGGER = logging.getLogger("personal_cabinet.ga4")
generator_server = None
generator_timer_task = None
generator_student_gateway_class = None
student_gateway_server = None
student_gateway_task = None


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
app.mount("/static/uploads", StaticFiles(directory=BASE_DIR / "generator" / "static" / "uploads"), name="generator_uploads")
app.mount("/static/vendor", StaticFiles(directory=BASE_DIR / "generator" / "static" / "vendor"), name="generator_vendor")
app.mount("/materials", StaticFiles(directory=MATERIALS_DIR), name="materials")
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
    embedded_generator_page = (
        request.url.path == "/generator/teacher"
        or request.url.path.startswith("/generator/exam/")
    )
    response.headers["X-Frame-Options"] = "SAMEORIGIN" if embedded_generator_page else "DENY"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; base-uri 'self'; object-src 'none'; "
        "frame-ancestors 'self'; form-action 'self'; "
        "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' ws: wss:; "
        "img-src 'self' data: blob:"
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
            CREATE TABLE IF NOT EXISTS materials_folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                description TEXT DEFAULT '',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS materials (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                media_type TEXT NOT NULL DEFAULT 'image',
                folder_name TEXT NOT NULL DEFAULT 'Общие',
                file_name TEXT DEFAULT '',
                file_path TEXT DEFAULT '',
                file_size INTEGER DEFAULT 0,
                mime_type TEXT DEFAULT '',
                source_url TEXT DEFAULT '',
                youtube_id TEXT DEFAULT '',
                youtube_thumbnail TEXT DEFAULT '',
                google_drive_id TEXT DEFAULT '',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
        db.execute("INSERT OR IGNORE INTO materials_folders (id, name, created_at) VALUES ('default', 'Общие', CURRENT_TIMESTAMP)")
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
    token = request.cookies.get(SESSION_COOKIE) or request.query_params.get("session_token")
    if not token:
        return None

    with closing(open_db()) as db:
        row = db.execute(
            """
            SELECT users.id, users.username, users.display_name, users.first_name, users.last_name, users.role
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ? AND CAST(sessions.expires_at AS INTEGER) > CAST(strftime('%s', 'now') AS INTEGER)
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


def site_lesson_catalog() -> list[dict]:
    excluded = {"Генератор тестов", "Личный кабинет", "дизайн элементов"}
    catalog = []
    for directory in sorted(BASE_DIR.parent.iterdir(), key=lambda item: item.name.casefold()):
        if not directory.is_dir() or directory.name in excluded or directory.name.startswith("."):
            continue
        lesson_files = sorted(
            directory.rglob("*.html"),
            key=lambda item: re.sub(
                r"\d+", lambda match: match.group().zfill(10),
                item.relative_to(directory).as_posix().casefold(),
            ),
        )
        if not lesson_files:
            continue

        groups = {}
        for lesson_file in lesson_files:
            content = lesson_file.read_text(encoding="utf-8")
            heading = re.search(r"<h1\b[^>]*>(.*?)</h1\s*>", content, re.IGNORECASE | re.DOTALL)
            title = heading.group(1) if heading else ""
            title = re.sub(r"<[^>]*>", " ", title)
            title = re.sub(r"\s+", " ", unescape(title)).strip()
            if not title:
                page_title = re.search(r"<title\b[^>]*>(.*?)</title\s*>", content, re.IGNORECASE | re.DOTALL)
                title = re.sub(r"\s+", " ", unescape(page_title.group(1))).strip() if page_title else ""
            if not title:
                title = lesson_file.stem

            relative_path = lesson_file.relative_to(BASE_DIR.parent).as_posix()
            group_name = lesson_file.parent.name if lesson_file.parent != directory else "Темы"
            groups.setdefault(group_name, []).append({
                "number": int(lesson_file.stem.split(maxsplit=1)[0].split(".", 1)[0])
                    if re.match(r"^\d+", lesson_file.stem) else None,
                "title": title,
                "href": f"https://alasster.site/{quote(relative_path, safe='/')}",
            })

        catalog.append({
            "name": directory.name,
            "lessons": len(lesson_files),
            "groups": [
                {
                    "name": name,
                    "lessons": sorted(
                        lessons,
                        key=lambda lesson: (
                            lesson["number"] is None,
                            lesson["number"] if lesson["number"] is not None else 0,
                            lesson["title"].casefold(),
                        ),
                    ),
                }
                for name, lessons in groups.items()
            ],
        })
    return catalog


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


async def get_generator_teacher(request: Request) -> dict:
    user = get_user_from_request(request)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Требуется авторизация")
    if user["role"] not in {"teacher", "admin", "superadmin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Раздел доступен учителям и администраторам")

    async with generator_server.get_db() as db:
        cursor = await db.execute(
            "SELECT id, username, full_name, created_at FROM teachers WHERE lower(username) = lower(?)",
            (user["username"],),
        )
        teacher = await cursor.fetchone()
        if teacher is None and user["role"] in {"admin", "superadmin"}:
            cursor = await db.execute(
                "SELECT id, username, full_name, created_at FROM teachers ORDER BY created_at, id"
            )
            legacy_teachers = await cursor.fetchall()
            if len(legacy_teachers) == 1:
                teacher = legacy_teachers[0]
        if teacher is None:
            teacher_id = str(uuid.uuid4())
            await db.execute(
                "INSERT INTO teachers (id, username, password_hash, full_name, created_at) VALUES (?, ?, ?, ?, ?)",
                (
                    teacher_id,
                    user["username"],
                    generator_server.hash_password(secrets.token_urlsafe(48)),
                    user["display_name"] or user["username"],
                    datetime.now().isoformat(),
                ),
            )
            await db.commit()
            cursor = await db.execute(
                "SELECT id, username, full_name, created_at FROM teachers WHERE id = ?",
                (teacher_id,),
            )
            teacher = await cursor.fetchone()
    return dict(teacher)


def load_generator_server():
    os.environ["BAGALAU_DB_DIR"] = str(GENERATOR_DATA_DIR)
    generator_path = str(GENERATOR_DIR)
    sys.path.insert(0, generator_path)
    try:
        spec = importlib.util.spec_from_file_location(
            "personal_cabinet_generator_server",
            GENERATOR_DIR / "server.py",
        )
        if spec is None or spec.loader is None:
            raise RuntimeError("Не удалось загрузить сервер генератора тестов")
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        gateway_module = importlib.import_module("public_gateway")
    except Exception:
        sys.modules.pop("personal_cabinet_generator_server", None)
        raise
    finally:
        sys.path.remove(generator_path)

    module.app.dependency_overrides[module.get_current_teacher] = get_generator_teacher
    module.app.router.routes = [
        route for route in module.app.router.routes
        if route.path not in {"/api/teacher/login", "/api/teacher/logout"}
    ]
    return module, gateway_module.StudentPublicGateway


async def start_student_gateway() -> None:
    global student_gateway_server, student_gateway_task
    import uvicorn

    gateway_app = generator_student_gateway_class(app)
    config = uvicorn.Config(
        gateway_app,
        host="0.0.0.0",
        port=int(os.environ.get("BAGALAU_STUDENT_PORT", "8001")),
        lifespan="off",
        log_config=None,
    )
    student_gateway_server = uvicorn.Server(config)
    student_gateway_task = asyncio.create_task(student_gateway_server.serve())
    for _ in range(50):
        if student_gateway_server.started:
            return
        if student_gateway_task.done():
            await student_gateway_task
            raise RuntimeError("Не удалось запустить ученический сервер на порту 8001")
        await asyncio.sleep(0.1)
    raise RuntimeError("Не удалось запустить ученический сервер на порту 8001")


@app.on_event("startup")
async def startup() -> None:
    global generator_server, generator_timer_task, generator_student_gateway_class
    init_db()
    generator_server, generator_student_gateway_class = load_generator_server()
    await generator_server.init_db()
    app.dependency_overrides[generator_server.get_current_teacher] = get_generator_teacher
    for route in generator_server.app.routes:
        if hasattr(route, "path") and route.path not in {
            "/", "/api/health", "/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc", "/static", "/teacher/login"
        }:
            app.routes.append(route)
    app.mount("/generator", generator_server.app, name="test_generator")
    generator_timer_task = asyncio.create_task(generator_server.background_timer_and_heartbeat_checker())
    await start_student_gateway()


@app.on_event("shutdown")
async def shutdown() -> None:
    if generator_timer_task is not None:
        generator_timer_task.cancel()
        await asyncio.gather(generator_timer_task, return_exceptions=True)
    if student_gateway_server is not None:
        student_gateway_server.should_exit = True
    if student_gateway_task is not None:
        await asyncio.gather(student_gateway_task, return_exceptions=True)


@app.get("/", response_class=HTMLResponse)
def dashboard(request: Request):
    user = get_user_from_request(request)
    if user is None:
        return RedirectResponse("/login", status_code=status.HTTP_303_SEE_OTHER)
    resp = HTMLResponse(page("dashboard.html"))
    query_token = request.query_params.get("session_token")
    if query_token:
        resp.set_cookie(SESSION_COOKIE, query_token, max_age=SESSION_TTL, httponly=True, samesite="lax")
    return resp


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


@app.get("/api/lessons-catalog")
def lessons_catalog(request: Request):
    if get_user_from_request(request) is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)
    return {"classes": site_lesson_catalog()}


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
    token = request.cookies.get(SESSION_COOKIE) or request.query_params.get("session_token")
    if token:
        with closing(open_db()) as db:
            db.execute("DELETE FROM sessions WHERE token_hash = ?", (token_digest(token),))
            db.commit()
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True}



# =========================================================================
# Мои материалы (ImgBB-подобный медиахостинг с поддержкой Google Диска)
# =========================================================================

class AddImageUrlRequest(BaseModel):
    url: str
    title: str = ""
    folder: str = "Общие"

class AddVideoRequest(BaseModel):
    url: str
    title: str = ""
    folder: str = "Общие"

class CreateFolderRequest(BaseModel):
    name: str
    description: str = ""

class UpdateMaterialRequest(BaseModel):
    title: str | None = None
    folder_name: str | None = None

def resolve_google_drive_file_id(file_name: str) -> str | None:
    try:
        drivefs_root = Path(os.path.expandvars(r"%LOCALAPPDATA%\Google\DriveFS"))
        if not drivefs_root.exists():
            return None
        for acc_dir in drivefs_root.iterdir():
            if acc_dir.is_dir() and acc_dir.name.isdigit():
                db_path = acc_dir / "metadata_sqlite_db"
                if db_path.exists():
                    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
                    conn.text_factory = lambda b: b.decode("utf-8", "ignore")
                    with closing(conn.cursor()) as cur:
                        cur.execute("SELECT id FROM items WHERE local_title = ? AND trashed = 0 LIMIT 1", (file_name,))
                        row = cur.fetchone()
                        if row:
                            return row[0]
    except Exception:
        pass
    return None

def extract_youtube_id(url: str) -> str | None:
    patterns = [
        r"(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})",
        r"^([a-zA-Z0-9_-]{11})$",
    ]
    for pattern in patterns:
        m = re.search(pattern, url.strip())
        if m:
            return m.group(1)
    return None

def build_material_links(item: dict, base_url: str) -> dict:
    folder = item.get("folder_name") or "Общие"
    fname = item.get("file_name") or ""
    media_type = item.get("media_type") or "image"
    yid = item.get("youtube_id") or ""
    gid = item.get("google_drive_id") or ""
    title = item.get("title") or fname or "Материал"

    # Working direct URL via cabinet server
    local_direct_link = f"{base_url}/materials/{quote(folder)}/{quote(fname)}" if fname else ""

    # Real Google Drive links (only if real cloud ID is present)
    if gid and not gid.startswith("local-"):
        google_drive_link = f"https://drive.google.com/file/d/{gid}/view?usp=sharing"
        google_drive_direct = f"https://lh3.googleusercontent.com/d/{gid}"
        primary_image_url = google_drive_direct
    else:
        google_drive_link = ""
        google_drive_direct = ""
        primary_image_url = local_direct_link

    if media_type == "video" and yid:
        watch_link = f"https://youtu.be/{yid}"
        embed_code = f'<iframe width="560" height="315" src="https://www.youtube.com/embed/{yid}" title="{title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
        markdown_code = f'[![{title}](https://img.youtube.com/vi/{yid}/maxresdefault.jpg)](https://www.youtube.com/watch?v={yid})'
        bbcode = f'[video]https://www.youtube.com/watch?v={yid}[/video]'
        preview_url = item.get("youtube_thumbnail") or f"https://img.youtube.com/vi/{yid}/hqdefault.jpg"
    else:
        watch_link = ""
        embed_code = f'<img src="{primary_image_url}" alt="{title}" />'
        markdown_code = f'![{title}]({primary_image_url})'
        bbcode = f'[img]{primary_image_url}[/img]'
        preview_url = local_direct_link

    return {
        "google_drive_link": google_drive_link,
        "google_drive_direct": google_drive_direct,
        "site_direct_link": local_direct_link,
        "local_direct_link": local_direct_link,
        "html_code": embed_code,
        "markdown_code": markdown_code,
        "bbcode": bbcode,
        "watch_link": watch_link,
        "preview_url": preview_url,
    }

@app.get("/api/materials")
def get_materials(request: Request, folder: str = "", media_type: str = "all", search: str = ""):
    user = get_user_from_request(request)
    if user is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)

    base_url = str(request.base_url).rstrip("/")
    with closing(open_db()) as db:
        folders = [dict(r) for r in db.execute("SELECT * FROM materials_folders ORDER BY name ASC").fetchall()]
        
        query = "SELECT * FROM materials WHERE 1=1"
        params = []
        if folder:
            query += " AND folder_name = ?"
            params.append(folder)
        if media_type and media_type != "all":
            query += " AND media_type = ?"
            params.append(media_type)
        if search.strip():
            query += " AND (title LIKE ? OR file_name LIKE ?)"
            s = f"%{search.strip()}%"
            params.extend([s, s])
        query += " ORDER BY created_at DESC"

        rows = [dict(r) for r in db.execute(query, params).fetchall()]

        # Compute stats
        total_count = len(rows)
        images_count = sum(1 for r in rows if r["media_type"] == "image")
        videos_count = sum(1 for r in rows if r["media_type"] == "video")
        total_size = sum(r["file_size"] or 0 for r in rows)

        items = []
        for r in rows:
            # Auto-check Google Drive ID if missing
            if r["media_type"] == "image" and r["file_name"] and not r["google_drive_id"]:
                gid = resolve_google_drive_file_id(r["file_name"])
                if gid:
                    r["google_drive_id"] = gid
                    db.execute("UPDATE materials SET google_drive_id = ? WHERE id = ?", (gid, r["id"]))
                    db.commit()
            item_data = dict(r)
            item_data["links"] = build_material_links(item_data, base_url)
            items.append(item_data)

    return {
        "items": items,
        "folders": folders,
        "stats": {
            "total_count": total_count,
            "images_count": images_count,
            "videos_count": videos_count,
            "folders_count": len(folders),
            "total_size": total_size
        }
    }

@app.post("/api/materials/upload")
async def upload_materials_endpoint(request: Request, files: list[UploadFile] = File(...), folder: str = Form("Общие")):
    user = get_user_from_request(request)
    if user is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)

    folder = folder.strip() or "Общие"
    target_dir = MATERIALS_DIR / folder
    target_dir.mkdir(parents=True, exist_ok=True)
    base_url = str(request.base_url).rstrip("/")

    created_items = []
    with closing(open_db()) as db:
        # Ensure folder in DB
        db.execute("INSERT OR IGNORE INTO materials_folders (id, name, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)", (str(uuid.uuid4()), folder))

        for upload in files:
            orig_name = Path(upload.filename or "image.png").name
            # clean name
            clean_name = re.sub(r'[^a-zA-Z0-9_Ѐ-ӿ\.-]', '_', orig_name)
            if not clean_name or clean_name.startswith('.'):
                clean_name = f"image_{secrets.token_hex(4)}.png"

            dest_path = target_dir / clean_name
            counter = 1
            stem, ext = os.path.splitext(clean_name)
            while dest_path.exists():
                clean_name = f"{stem}_{counter}{ext}"
                dest_path = target_dir / clean_name
                counter += 1

            content = await upload.read()
            with open(dest_path, "wb") as f:
                f.write(content)

            file_size = len(content)
            mime = upload.content_type or "image/png"
            mid = str(uuid.uuid4())
            rel_path = f"{folder}/{clean_name}"
            title = stem.replace("_", " ").strip() or "Изображение"

            # Check Google Drive ID
            gid = resolve_google_drive_file_id(clean_name) or ""

            db.execute("""
                INSERT INTO materials (id, title, media_type, folder_name, file_name, file_path, file_size, mime_type, google_drive_id, created_at)
                VALUES (?, ?, 'image', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (mid, title, folder, clean_name, rel_path, file_size, mime, gid))

            item_dict = {
                "id": mid,
                "title": title,
                "media_type": "image",
                "folder_name": folder,
                "file_name": clean_name,
                "file_path": rel_path,
                "file_size": file_size,
                "mime_type": mime,
                "google_drive_id": gid,
            }
            item_dict["links"] = build_material_links(item_dict, base_url)
            created_items.append(item_dict)

        db.commit()

    return {"ok": True, "created": created_items}

@app.post("/api/materials/add-image-url")
def add_image_from_url_endpoint(payload: AddImageUrlRequest, request: Request):
    user = get_user_from_request(request)
    if user is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)

    url = payload.url.strip()
    if not url.startswith(("http://", "https://")):
        return JSONResponse({"detail": "Некорректная ссылка на изображение"}, status_code=400)

    folder = payload.folder.strip() or "Общие"
    target_dir = MATERIALS_DIR / folder
    target_dir.mkdir(parents=True, exist_ok=True)
    base_url = str(request.base_url).rstrip("/")

    import urllib.request
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            content = resp.read()
            mime = resp.headers.get("Content-Type", "").split(";")[0] or "image/jpeg"
    except Exception as e:
        return JSONResponse({"detail": f"Не удалось загрузить изображение по ссылке: {e}"}, status_code=400)

    ext = ".jpg"
    if "png" in mime: ext = ".png"
    elif "webp" in mime: ext = ".webp"
    elif "gif" in mime: ext = ".gif"
    elif "svg" in mime: ext = ".svg"

    parsed_path = urllib.parse.urlparse(url).path
    raw_name = Path(parsed_path).name or "image"
    stem = os.path.splitext(raw_name)[0]
    stem = re.sub(r'[^a-zA-Z0-9_Ѐ-ӿ-]', '_', stem) or f"img_{secrets.token_hex(4)}"

    filename = f"{stem}{ext}"
    dest_path = target_dir / filename
    counter = 1
    while dest_path.exists():
        filename = f"{stem}_{counter}{ext}"
        dest_path = target_dir / filename
        counter += 1

    with open(dest_path, "wb") as f:
        f.write(content)

    file_size = len(content)
    mid = str(uuid.uuid4())
    rel_path = f"{folder}/{filename}"
    title = payload.title.strip() or stem.replace("_", " ").strip()
    gid = resolve_google_drive_file_id(filename) or ""

    with closing(open_db()) as db:
        db.execute("INSERT OR IGNORE INTO materials_folders (id, name, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)", (str(uuid.uuid4()), folder))
        db.execute("""
            INSERT INTO materials (id, title, media_type, folder_name, file_name, file_path, file_size, mime_type, source_url, google_drive_id, created_at)
            VALUES (?, ?, 'image', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (mid, title, folder, filename, rel_path, file_size, mime, url, gid))
        db.commit()

    item_dict = {
        "id": mid,
        "title": title,
        "media_type": "image",
        "folder_name": folder,
        "file_name": filename,
        "file_path": rel_path,
        "file_size": file_size,
        "mime_type": mime,
        "source_url": url,
        "google_drive_id": gid,
    }
    item_dict["links"] = build_material_links(item_dict, base_url)
    return {"ok": True, "created": item_dict}

@app.post("/api/materials/add-video")
def add_video_endpoint(payload: AddVideoRequest, request: Request):
    user = get_user_from_request(request)
    if user is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)

    url = payload.url.strip()
    yid = extract_youtube_id(url)
    if not yid:
        return JSONResponse({"detail": "Не удалось распознать YouTube ссылку. Поддерживаются ссылки вида https://youtu.be/... или https://youtube.com/watch?v=..."}, status_code=400)

    title = payload.title.strip()
    thumb = f"https://img.youtube.com/vi/{yid}/maxresdefault.jpg"
    folder = payload.folder.strip() or "Общие"
    base_url = str(request.base_url).rstrip("/")

    # Try fetching title from oEmbed
    if not title:
        try:
            import urllib.request, json
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={yid}&format=json"
            oreq = urllib.request.Request(oembed_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(oreq, timeout=6) as oresp:
                odata = json.loads(oresp.read().decode('utf-8'))
                title = odata.get("title") or ""
                if odata.get("thumbnail_url"):
                    thumb = odata["thumbnail_url"]
        except Exception:
            pass

    if not title:
        title = f"YouTube видео ({yid})"

    mid = str(uuid.uuid4())
    with closing(open_db()) as db:
        db.execute("INSERT OR IGNORE INTO materials_folders (id, name, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)", (str(uuid.uuid4()), folder))
        db.execute("""
            INSERT INTO materials (id, title, media_type, folder_name, source_url, youtube_id, youtube_thumbnail, created_at)
            VALUES (?, ?, 'video', ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (mid, title, folder, url, yid, thumb))
        db.commit()

    item_dict = {
        "id": mid,
        "title": title,
        "media_type": "video",
        "folder_name": folder,
        "source_url": url,
        "youtube_id": yid,
        "youtube_thumbnail": thumb,
    }
    item_dict["links"] = build_material_links(item_dict, base_url)
    return {"ok": True, "created": item_dict}

@app.post("/api/materials/folders")
def create_materials_folder_endpoint(payload: CreateFolderRequest, request: Request):
    user = get_user_from_request(request)
    if user is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)

    name = payload.name.strip()
    if not name or len(name) > 60:
        return JSONResponse({"detail": "Введите корректное название альбома (до 60 знаков)"}, status_code=400)

    clean_name = re.sub(r'[\/:*?"<>|]', '_', name).strip()
    folder_dir = MATERIALS_DIR / clean_name
    folder_dir.mkdir(parents=True, exist_ok=True)

    with closing(open_db()) as db:
        try:
            db.execute("INSERT INTO materials_folders (id, name, description, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", (str(uuid.uuid4()), clean_name, payload.description.strip()))
            db.commit()
        except sqlite3.IntegrityError:
            return JSONResponse({"detail": "Альбом с таким названием уже существует"}, status_code=400)

    return {"ok": True, "folder": clean_name}

@app.delete("/api/materials/folders/{folder_name}")
def delete_materials_folder_endpoint(folder_name: str, request: Request):
    user = get_user_from_request(request)
    if user is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)

    if folder_name == "Общие":
        return JSONResponse({"detail": "Основной альбом 'Общие' нельзя удалить"}, status_code=400)

    with closing(open_db()) as db:
        # Move materials from this folder to "Общие"
        db.execute("UPDATE materials SET folder_name = 'Общие' WHERE folder_name = ?", (folder_name,))
        db.execute("DELETE FROM materials_folders WHERE name = ?", (folder_name,))
        db.commit()

    # Move physical files if any
    old_dir = MATERIALS_DIR / folder_name
    dest_dir = MATERIALS_DIR / "Общие"
    if old_dir.exists():
        import shutil
        for p in old_dir.iterdir():
            target = dest_dir / p.name
            if not target.exists():
                shutil.move(str(p), str(target))
        try:
            old_dir.rmdir()
        except Exception:
            pass

    return {"ok": True}

@app.delete("/api/materials/{item_id}")
def delete_material_endpoint(item_id: str, request: Request):
    user = get_user_from_request(request)
    if user is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)

    with closing(open_db()) as db:
        row = db.execute("SELECT * FROM materials WHERE id = ?", (item_id,)).fetchone()
        if not row:
            return JSONResponse({"detail": "Элемент не найден"}, status_code=404)

        folder = row["folder_name"]
        fname = row["file_name"]
        if fname:
            fpath = MATERIALS_DIR / folder / fname
            if fpath.exists():
                try:
                    fpath.unlink()
                except Exception:
                    pass

        db.execute("DELETE FROM materials WHERE id = ?", (item_id,))
        db.commit()

    return {"ok": True}

@app.patch("/api/materials/{item_id}")
def update_material_endpoint(item_id: str, payload: UpdateMaterialRequest, request: Request):
    user = get_user_from_request(request)
    if user is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)

    with closing(open_db()) as db:
        row = db.execute("SELECT * FROM materials WHERE id = ?", (item_id,)).fetchone()
        if not row:
            return JSONResponse({"detail": "Элемент не найден"}, status_code=404)

        updates = []
        params = []
        if payload.title is not None and payload.title.strip():
            updates.append("title = ?")
            params.append(payload.title.strip())

        if payload.folder_name is not None and payload.folder_name.strip():
            new_folder = payload.folder_name.strip()
            old_folder = row["folder_name"]
            if new_folder != old_folder:
                updates.append("folder_name = ?")
                params.append(new_folder)
                # Move file on disk
                if row["file_name"]:
                    old_path = MATERIALS_DIR / old_folder / row["file_name"]
                    new_dir = MATERIALS_DIR / new_folder
                    new_dir.mkdir(parents=True, exist_ok=True)
                    new_path = new_dir / row["file_name"]
                    if old_path.exists():
                        import shutil
                        shutil.move(str(old_path), str(new_path))
                    updates.append("file_path = ?")
                    params.append(f"{new_folder}/{row['file_name']}")

        if updates:
            params.append(item_id)
            db.execute(f"UPDATE materials SET {', '.join(updates)} WHERE id = ?", params)
            db.commit()

    return {"ok": True}

@app.post("/api/materials/sync-drive")
def sync_drive_endpoint(request: Request):
    user = get_user_from_request(request)
    if user is None:
        return JSONResponse({"detail": "Требуется авторизация"}, status_code=401)

    updated_count = 0
    with closing(open_db()) as db:
        rows = db.execute("SELECT id, file_name, google_drive_id FROM materials WHERE media_type = 'image' AND file_name != ''").fetchall()
        for r in rows:
            gid = resolve_google_drive_file_id(r["file_name"])
            if gid and gid != r["google_drive_id"]:
                db.execute("UPDATE materials SET google_drive_id = ? WHERE id = ?", (gid, r["id"]))
                updated_count += 1
        db.commit()

    return {"ok": True, "updated_count": updated_count}


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/health")
def generator_compatible_health():
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host=os.environ.get("PERSONAL_CABINET_HOST", "127.0.0.1"), port=int(os.environ.get("PERSONAL_CABINET_PORT", "8010")), reload=False)
