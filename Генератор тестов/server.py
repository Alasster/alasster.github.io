import os
import sys
import json

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
import uuid
import secrets
import asyncio
import logging
import shutil
import subprocess
import unicodedata
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Request, Response, HTTPException, status, Depends, Query, BackgroundTasks, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_db, DB_PATH
from auth import (
    hash_password, verify_password,
    create_teacher_session, destroy_teacher_session,
    get_current_teacher, get_current_student_attempt, TEACHER_SESSIONS
)
from models import (
    TeacherLoginRequest, TeacherRegisterRequest,
    CreateTestRequest, UpdateTestRequest, TaskItem,
    CreateLaunchRequest, UpdateLaunchStatusRequest, UpdateLaunchSettingsRequest,
    StudentJoinRequest, SaveAnswerRequest, BatchSaveAnswersRequest, StudentSubmitRequest,
    TeacherActionStudentRequest, GradeSingleAnswerRequest, RosterImportRequest,
    StudentTaskView, CreateLessonPageRequest, DeleteLessonPageRequest, CreateBackupRequest
)
from evaluator import evaluate_answer
from export import generate_excel_report, generate_csv_report
from backup import create_backup, restore_backup, list_backups, delete_backup

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("bagalau.server")

BASE_DIR = os.path.dirname(__file__)

app = FastAPI(title="«Бағалау» — Система проведения СОР и СОЧ", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

# SSE event bus for teacher live updates: launch_id -> set of asyncio.Queue
LIVE_STREAMS: Dict[str, List[asyncio.Queue]] = {}


def attempt_deadline_expired(attempt: dict, grace_seconds: int = 10) -> bool:
    """Return whether a student's server-side deadline has passed."""
    deadline = attempt.get("server_deadline")
    if not deadline:
        return False
    try:
        deadline_dt = datetime.fromisoformat(deadline)
        if deadline_dt.tzinfo is None:
            deadline_dt = deadline_dt.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) > deadline_dt + timedelta(seconds=grace_seconds)
    except (TypeError, ValueError):
        return False

def broadcast_live_event(launch_id: str, event_type: str, data: Any):
    if launch_id in LIVE_STREAMS:
        payload = json.dumps({"event": event_type, "data": data, "timestamp": datetime.now().isoformat()})
        for q in list(LIVE_STREAMS[launch_id]):
            try:
                q.put_nowait(payload)
            except Exception:
                pass

async def background_timer_and_heartbeat_checker():
    """Фоновый серверный механизм: автозавершение попыток при истечении серверного времени"""
    while True:
        try:
            await asyncio.sleep(5)
            now_iso = datetime.now(timezone.utc).isoformat()
            async with get_db() as db:
                # Находим попытки, у которых server_deadline просрочен, а статус все еще in_progress
                cursor = await db.execute("""
                    SELECT sa.id, sa.launch_id, sa.server_deadline, sa.extra_time_minutes, l.snapshot_tasks_json
                    FROM student_attempts sa
                    JOIN launches l ON sa.launch_id = l.id
                    WHERE sa.status = 'in_progress' AND sa.server_deadline IS NOT NULL
                """)
                attempts = await cursor.fetchall()
                for row in attempts:
                    att_id = row["id"]
                    launch_id = row["launch_id"]
                    deadline_str = row["server_deadline"]
                    
                    try:
                        deadline_dt = datetime.fromisoformat(deadline_str)
                        if deadline_dt.tzinfo is None:
                            deadline_dt = deadline_dt.replace(tzinfo=timezone.utc)
                    except Exception:
                        continue

                    if datetime.now(timezone.utc) >= deadline_dt:
                        # Срок истек! Фиксируем завершение сервером
                        logger.info("Server timer expired for attempt %s in launch %s", att_id, launch_id)
                        conf_code = f"BAG-{datetime.now().strftime('%Y')}-{secrets.token_hex(3).upper()}"
                        await db.execute("""
                            UPDATE student_attempts
                            SET status = 'time_expired', submitted_at = ?, confirmation_code = ?
                            WHERE id = ? AND status = 'in_progress'
                        """, (datetime.now(timezone.utc).isoformat(), conf_code, att_id))
                        
                        # Проводим объективную автопроверку сохраненных ответов
                        await auto_grade_attempt(db, att_id, row["snapshot_tasks_json"])
                        await db.commit()
                        
                        broadcast_live_event(launch_id, "student_time_expired", {"attempt_id": att_id, "status": "time_expired"})
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("Error in timer checker: %s", e)

async def auto_enable_internet_access():
    """Start the optional public student gateway after the server is listening."""
    if os.environ.get("BAGALAU_AUTO_INTERNET", "1").strip().lower() in {"0", "false", "no", "off"}:
        return
    await asyncio.sleep(5)
    script_path = os.path.join(BASE_DIR, "enable_internet.ps1")
    if not os.path.isfile(script_path) or sys.platform != "win32":
        return
    powershell = shutil.which("powershell.exe") or shutil.which("pwsh.exe")
    if not powershell:
        logger.info("Интернет-ссылка не запущена: PowerShell не найден")
        return
    runtime_dir = os.path.join(BASE_DIR, ".runtime")
    os.makedirs(runtime_dir, exist_ok=True)
    log_path = os.path.join(runtime_dir, "auto-internet.log")
    try:
        log_file = open(log_path, "a", encoding="utf-8")
        creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        subprocess.Popen(
            [powershell, "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script_path],
            cwd=BASE_DIR,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            creationflags=creationflags,
            close_fds=False,
        )
        log_file.close()
        logger.info("Автозапуск интернет-ссылки отправлен в фон")
    except Exception as exc:
        logger.warning("Не удалось запустить интернет-ссылку автоматически: %s", exc)

@app.on_event("startup")
async def on_startup():
    await init_db()
    # Создаем стандартную учетную запись учителя, если база пустая
    async with get_db() as db:
        cursor = await db.execute("SELECT COUNT(*) as cnt FROM teachers")
        row = await cursor.fetchone()
        if row["cnt"] == 0:
            default_id = str(uuid.uuid4())
            pass_hash = hash_password("bagalau2026")
            await db.execute("""
                INSERT INTO teachers (id, username, password_hash, full_name, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (default_id, "teacher", pass_hash, "Кадыржанов Жанас Кайыржанович", datetime.now().isoformat()))
            await db.commit()
            logger.info("Default teacher account created: login 'teacher', password 'bagalau2026'")
            
    asyncio.create_task(background_timer_and_heartbeat_checker())
    asyncio.create_task(auto_enable_internet_access())

# Helper: автоматическая проверка объективных заданий
async def auto_grade_attempt(db, attempt_id: str, snapshot_tasks_json: str):
    try:
        tasks = json.loads(snapshot_tasks_json) if isinstance(snapshot_tasks_json, str) else snapshot_tasks_json
    except Exception:
        tasks = []

    cursor = await db.execute("SELECT * FROM student_answers WHERE attempt_id = ?", (attempt_id,))
    answers = await cursor.fetchall()
    answers_map = {a["task_id"]: a for a in answers}

    cur_att = await db.execute("SELECT variant FROM student_attempts WHERE id = ?", (attempt_id,))
    att_row = await cur_att.fetchone()
    stu_var = str(att_row["variant"] if att_row and "variant" in att_row.keys() and att_row["variant"] else "1")

    for t in tasks:
        t_var = str(t.get("variant") or "1")
        if t_var not in (stu_var, "all", "1,2"):
            continue
        t_id = t["id"]
        task_type = t.get("question_type", "single_choice")
        ans_row = answers_map.get(t_id)
        raw_ans = None
        if ans_row and ans_row["answer_json"]:
            try:
                raw_ans = json.loads(ans_row["answer_json"])
            except Exception:
                raw_ans = ans_row["answer_json"]

        score, is_graded = evaluate_answer(
            task_type=task_type,
            student_answer=raw_ans,
            answer_key=t.get("answer_key"),
            max_score=float(t.get("max_score", 1.0)),
            check_method=t.get("check_method", "exact"),
            tolerance=float(t.get("tolerance", 0.0))
        )

        final_sc = score if is_graded else None
        now_str = datetime.now().isoformat()

        if ans_row:
            await db.execute("""
                UPDATE student_answers
                SET auto_score = ?, final_score = COALESCE(manual_score, ?), is_graded = ?, updated_at = ?
                WHERE id = ?
            """, (score, final_sc, 1 if is_graded else 0, now_str, ans_row["id"]))
        else:
            ans_id = str(uuid.uuid4())
            await db.execute("""
                INSERT INTO student_answers (id, attempt_id, task_id, answer_json, version, auto_score, final_score, is_graded, updated_at)
                VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
            """, (ans_id, attempt_id, t_id, None, score, final_sc, 1 if is_graded else 0, now_str))

# --- HTML Страницы ---
@app.get("/", response_class=HTMLResponse)
async def index_page():
    return RedirectResponse(url="/teacher")

@app.get("/teacher", response_class=HTMLResponse)
async def teacher_cabinet_page():
    with open(os.path.join(BASE_DIR, "templates", "teacher.html"), encoding="utf-8") as f:
        return f.read()

@app.get("/teacher/login", response_class=HTMLResponse)
async def teacher_login_page():
    with open(os.path.join(BASE_DIR, "templates", "login.html"), encoding="utf-8") as f:
        return f.read()

@app.get("/exam/{launch_id}", response_class=HTMLResponse)
async def student_exam_page(launch_id: str):
    with open(os.path.join(BASE_DIR, "templates", "exam.html"), encoding="utf-8") as f:
        return f.read()

# --- Auth Endpoints ---
@app.post("/api/teacher/login")
async def teacher_login(req: TeacherLoginRequest, response: Response):
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM teachers WHERE username = ?", (req.username.strip(),))
        teacher = await cursor.fetchone()
        if not teacher or not verify_password(req.password, teacher["password_hash"]):
            raise HTTPException(status_code=400, detail="Неверное имя пользователя или пароль")

        token = create_teacher_session(teacher["id"])
        response.set_cookie(
            key="bagalau_teacher_session",
            value=token,
            httponly=True,
            samesite="lax",
            max_age=86400 * 7
        )
        return {
            "token": token,
            "teacher": {
                "id": teacher["id"],
                "username": teacher["username"],
                "full_name": teacher["full_name"]
            }
        }

@app.post("/api/teacher/logout")
async def teacher_logout(request: Request, response: Response):
    token = request.cookies.get("bagalau_teacher_session")
    if token:
        destroy_teacher_session(token)
    response.delete_cookie("bagalau_teacher_session")
    return {"ok": True}

@app.get("/api/teacher/me")
async def teacher_me(teacher: dict = Depends(get_current_teacher)):
    return teacher

# --- Tests (Шаблоны работ) ---
@app.get("/api/tests")
async def list_tests(
    subject: Optional[str] = None,
    grade: Optional[str] = None,
    quarter: Optional[int] = None,
    exam_type: Optional[str] = None,
    archived: bool = False,
    search: Optional[str] = None,
    teacher: dict = Depends(get_current_teacher)
):
    query = "SELECT * FROM tests WHERE teacher_id = ? AND is_archived = ?"
    params = [teacher["id"], 1 if archived else 0]

    if subject:
        query += " AND subject = ?"
        params.append(subject)
    if grade:
        query += " AND grade_level = ?"
        params.append(grade)
    if quarter:
        query += " AND quarter = ?"
        params.append(quarter)
    if exam_type:
        query += " AND exam_type = ?"
        params.append(exam_type)
    if search:
        query += " AND (title LIKE ? OR instructions LIKE ?)"
        term = f"%{search.strip()}%"
        params.extend([term, term])

    query += " ORDER BY updated_at DESC"
    async with get_db() as db:
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        
        # Получаем количество заданий и суммарный балл
        tests_list = []
        for r in rows:
            td = dict(r)
            has_vars = bool(td.get("has_variants", 1))
            if has_vars:
                c2 = await db.execute("SELECT COUNT(*) as count, COALESCE(SUM(max_score), 0) as total_score FROM tasks WHERE test_id = ? AND COALESCE(variant, '1') IN ('1', 'all', '1,2')", (td["id"],))
                stat = await c2.fetchone()
                if not stat or stat["count"] == 0:
                    c2 = await db.execute("SELECT COUNT(*) as count, COALESCE(SUM(max_score), 0) as total_score FROM tasks WHERE test_id = ?", (td["id"],))
                    stat = await c2.fetchone()
            else:
                c2 = await db.execute("SELECT COUNT(*) as count, COALESCE(SUM(max_score), 0) as total_score FROM tasks WHERE test_id = ?", (td["id"],))
                stat = await c2.fetchone()
            td["task_count"] = stat["count"]
            td["total_score"] = stat["total_score"]
            td["class_letters"] = json.loads(td["class_letters_json"]) if td.get("class_letters_json") else []
            td["variant"] = td.get("variant") or "1"
            td["bg_color"] = td.get("bg_color") or "#f8fafc"
            td["bg_color_v1"] = td.get("bg_color_v1") or "#fce8e6"
            td["bg_color_v2"] = td.get("bg_color_v2") or "#e6f4ea"
            td["has_variants"] = has_vars
            td["duration_minutes"] = td.get("duration_minutes") if td.get("duration_minutes") is not None else 45
            tests_list.append(td)
        return tests_list

@app.get("/api/health")
async def health_check():
    return {"ok": True}

@app.post("/api/tests")
async def create_test(req: CreateTestRequest, teacher: dict = Depends(get_current_teacher)):
    test_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    letters_json = json.dumps(req.class_letters or [], ensure_ascii=False)
    bg = req.bg_color or "#f8fafc"
    bg_v1 = req.bg_color_v1 or "#fce8e6"
    bg_v2 = req.bg_color_v2 or "#e6f4ea"
    has_vars = 1 if req.has_variants is not False else 0
    var_str = str(req.variant or "1")
    dur = req.duration_minutes if req.duration_minutes is not None else 45
    async with get_db() as db:
        await db.execute("""
            INSERT INTO tests (
                id, teacher_id, title, exam_type, subject, grade_level,
                class_letters_json, variant, bg_color, bg_color_v1, bg_color_v2, has_variants,
                quarter, section, instructions, learning_objectives, assessment_criteria, is_archived, created_at, updated_at,
                duration_minutes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
        """, (
            test_id, teacher["id"], req.title.strip(), req.exam_type, req.subject.strip(),
            req.grade_level.strip(), letters_json, var_str, bg, bg_v1, bg_v2, has_vars,
            req.quarter, req.section, req.instructions,
            req.learning_objectives, req.assessment_criteria, now, now, dur
        ))
        await db.execute("UPDATE tests SET shuffle_options = ? WHERE id = ?", (int(req.shuffle_options), test_id))
        await db.commit()
    return {"id": test_id, "message": "Работа успешно создана"}

@app.get("/api/tests/{test_id}")
async def get_test(test_id: str, teacher: dict = Depends(get_current_teacher)):
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM tests WHERE id = ? AND teacher_id = ?", (test_id, teacher["id"]))
        test = await cursor.fetchone()
        if not test:
            raise HTTPException(status_code=404, detail="Работа не найдена")

        tasks_cur = await db.execute("SELECT * FROM tasks WHERE test_id = ? ORDER BY order_index ASC", (test_id,))
        raw_tasks = await tasks_cur.fetchall()
        tasks = []
        for rt in raw_tasks:
            t = dict(rt)
            t["options"] = json.loads(t["options_json"]) if t.get("options_json") else []
            t["answer_key"] = json.loads(t["answer_key_json"]) if t.get("answer_key_json") else None
            t["categories"] = json.loads(t["categories_json"]) if t.get("categories_json") else []
            t["image_size"] = t.get("image_size") or "100%"
            t["image_align"] = t.get("image_align") or "center"
            t["variant"] = t.get("variant") or "1"
            tasks.append(t)

        test_data = dict(test)
        test_data["class_letters"] = json.loads(test_data["class_letters_json"]) if test_data.get("class_letters_json") else []
        test_data["variant"] = test_data.get("variant") or "1"
        test_data["bg_color"] = test_data.get("bg_color") or "#f8fafc"
        test_data["bg_color_v1"] = test_data.get("bg_color_v1") or "#fce8e6"
        test_data["bg_color_v2"] = test_data.get("bg_color_v2") or "#e6f4ea"
        test_data["has_variants"] = bool(test_data.get("has_variants", 1))
        test_data["duration_minutes"] = test_data.get("duration_minutes") if test_data.get("duration_minutes") is not None else 45
        test_data["tasks"] = tasks
        return test_data

@app.put("/api/tests/{test_id}")
async def update_test(test_id: str, req: UpdateTestRequest, teacher: dict = Depends(get_current_teacher)):
    now = datetime.now().isoformat()
    letters_json = json.dumps(req.class_letters or [], ensure_ascii=False)
    bg = req.bg_color or "#f8fafc"
    bg_v1 = req.bg_color_v1 or "#fce8e6"
    bg_v2 = req.bg_color_v2 or "#e6f4ea"
    has_vars = 1 if req.has_variants is not False else 0
    var_str = str(req.variant or "1")
    dur = req.duration_minutes if req.duration_minutes is not None else 45
    async with get_db() as db:
        await db.execute("""
            UPDATE tests
            SET title = ?, exam_type = ?, subject = ?, grade_level = ?,
                class_letters_json = ?, variant = ?, bg_color = ?, bg_color_v1 = ?, bg_color_v2 = ?, has_variants = ?,
                quarter = ?, section = ?, instructions = ?, learning_objectives = ?,
                assessment_criteria = ?, is_archived = ?, updated_at = ?, shuffle_options = ?,
                duration_minutes = ?
            WHERE id = ? AND teacher_id = ?
        """, (
            req.title.strip(), req.exam_type, req.subject.strip(), req.grade_level.strip(),
            letters_json, var_str, bg, bg_v1, bg_v2, has_vars,
            req.quarter, req.section, req.instructions, req.learning_objectives,
            req.assessment_criteria, 1 if req.is_archived else 0, now, int(req.shuffle_options),
            dur, test_id, teacher["id"]
        ))
        await sync_launches_for_test(db, test_id)
        await db.commit()
    return {"ok": True}

async def sync_launches_for_test(db, test_id: str):
    """Синхронизирует слепок заданий (snapshot_tasks_json) во всех незавершённых проведениях (launches) данного теста,
       чтобы ссылка для учеников оставалась постоянной, а изменения заданий сразу вступали в силу без перепубликации урока."""
    tasks_cur = await db.execute("SELECT * FROM tasks WHERE test_id = ? ORDER BY order_index ASC", (test_id,))
    raw_tasks = await tasks_cur.fetchall()
    snapshot_tasks = []
    for rt in raw_tasks:
        t = dict(rt)
        t["options"] = json.loads(t["options_json"]) if t["options_json"] else []
        t["answer_key"] = json.loads(t["answer_key_json"]) if t["answer_key_json"] else None
        t["categories"] = json.loads(t["categories_json"]) if t.get("categories_json") else []
        t["variant"] = t.get("variant") or "1"
        snapshot_tasks.append(t)

    snap_json = json.dumps(snapshot_tasks, ensure_ascii=False)

    test_cur = await db.execute("SELECT bg_color, bg_color_v1, bg_color_v2, duration_minutes, class_letters_json, grade_level FROM tests WHERE id = ?", (test_id,))
    test_row = await test_cur.fetchone()
    if test_row:
        allowed_classes = []
        if test_row["class_letters_json"]:
            try:
                letters = json.loads(test_row["class_letters_json"])
                if letters and isinstance(letters, list):
                    allowed_classes = [f"{test_row['grade_level']} {l}".strip() for l in letters]
            except Exception:
                pass

        if allowed_classes:
            await db.execute("""
                UPDATE launches
                SET snapshot_tasks_json = ?,
                    bg_color = COALESCE(?, bg_color),
                    bg_color_v1 = COALESCE(?, bg_color_v1),
                    bg_color_v2 = COALESCE(?, bg_color_v2),
                    duration_minutes = COALESCE(?, duration_minutes),
                    allowed_classes_json = ?
                WHERE test_id = ? AND status != 'finished'
            """, (snap_json, test_row["bg_color"], test_row["bg_color_v1"], test_row["bg_color_v2"], test_row["duration_minutes"], json.dumps(allowed_classes, ensure_ascii=False), test_id))
        else:
            await db.execute("""
                UPDATE launches
                SET snapshot_tasks_json = ?,
                    bg_color = COALESCE(?, bg_color),
                    bg_color_v1 = COALESCE(?, bg_color_v1),
                    bg_color_v2 = COALESCE(?, bg_color_v2),
                    duration_minutes = COALESCE(?, duration_minutes)
                WHERE test_id = ? AND status != 'finished'
            """, (snap_json, test_row["bg_color"], test_row["bg_color_v1"], test_row["bg_color_v2"], test_row["duration_minutes"], test_id))
    else:
        await db.execute("""
            UPDATE launches
            SET snapshot_tasks_json = ?
            WHERE test_id = ? AND status != 'finished'
        """, (snap_json, test_id))

async def _delete_test_cascade(db, test_id: str, teacher_id: str):
    cur = await db.execute("SELECT id FROM launches WHERE test_id = ?", (test_id,))
    l_ids = [r["id"] for r in await cur.fetchall()]
    for lid in l_ids:
        await db.execute("DELETE FROM student_answers WHERE attempt_id IN (SELECT id FROM student_attempts WHERE launch_id = ?)", (lid,))
        await db.execute("DELETE FROM student_attempts WHERE launch_id = ?", (lid,))
        await db.execute("DELETE FROM audit_logs WHERE launch_id = ?", (lid,))
    await db.execute("DELETE FROM launches WHERE test_id = ?", (test_id,))
    await db.execute("DELETE FROM tasks WHERE test_id = ?", (test_id,))
    await db.execute("DELETE FROM tests WHERE id = ? AND teacher_id = ?", (test_id, teacher_id))
    cleanup_site_lessons_for_launches(os.path.dirname(BASE_DIR), l_ids)

@app.delete("/api/tests/{test_id}")
async def delete_test(test_id: str, permanent: bool = Query(False), teacher: dict = Depends(get_current_teacher)):
    async with get_db() as db:
        c = await db.execute("SELECT id FROM tests WHERE id = ? AND teacher_id = ?", (test_id, teacher["id"]))
        if not await c.fetchone():
            raise HTTPException(status_code=404, detail="Работа не найдена")

        if permanent:
            await _delete_test_cascade(db, test_id, teacher["id"])
            await db.commit()
            return {"deleted": True, "permanent": True}

        # Обычное удаление: перемещаем в архив
        now = datetime.now().isoformat()
        await db.execute("UPDATE tests SET is_archived = 1, updated_at = ? WHERE id = ? AND teacher_id = ?", (now, test_id, teacher["id"]))
        await db.commit()
    return {"archived": True, "message": "Работа перемещена в архив."}

@app.delete("/api/tests/{test_id}/permanent")
async def delete_test_permanent(test_id: str, teacher: dict = Depends(get_current_teacher)):
    async with get_db() as db:
        c = await db.execute("SELECT id FROM tests WHERE id = ? AND teacher_id = ?", (test_id, teacher["id"]))
        if not await c.fetchone():
            raise HTTPException(status_code=404, detail="Работа не найдена")
        await _delete_test_cascade(db, test_id, teacher["id"])
        await db.commit()
    return {"deleted": True, "permanent": True}

@app.post("/api/tests/{test_id}/restore")
async def restore_test(test_id: str, teacher: dict = Depends(get_current_teacher)):
    now = datetime.now().isoformat()
    async with get_db() as db:
        c = await db.execute("SELECT id FROM tests WHERE id = ? AND teacher_id = ?", (test_id, teacher["id"]))
        if not await c.fetchone():
            raise HTTPException(status_code=404, detail="Работа не найдена")
        await db.execute("UPDATE tests SET is_archived = 0, updated_at = ? WHERE id = ? AND teacher_id = ?", (now, test_id, teacher["id"]))
        await db.commit()
    return {"restored": True}

@app.post("/api/tests/{test_id}/duplicate")
async def duplicate_test(test_id: str, teacher: dict = Depends(get_current_teacher)):
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM tests WHERE id = ? AND teacher_id = ?", (test_id, teacher["id"]))
        test = await cursor.fetchone()
        if not test:
            raise HTTPException(status_code=404, detail="Работа не найдена")

        new_test_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        new_title = f"{test['title']} (Копия)"

        dur = test["duration_minutes"] if ("duration_minutes" in test.keys() and test["duration_minutes"] is not None) else 45
        await db.execute("""
            INSERT INTO tests (
                id, teacher_id, title, exam_type, subject, grade_level,
                class_letters_json, variant, bg_color, bg_color_v1, bg_color_v2, has_variants,
                quarter, section, instructions,
                learning_objectives, assessment_criteria, is_archived, created_at, updated_at,
                duration_minutes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
        """, (
            new_test_id, teacher["id"], new_title, test["exam_type"], test["subject"],
            test["grade_level"], test["class_letters_json"], test["variant"], test["bg_color"],
            test.get("bg_color_v1") or "#fce8e6", test.get("bg_color_v2") or "#e6f4ea", test.get("has_variants", 1),
            test["quarter"], test["section"], test["instructions"],
            test["learning_objectives"], test["assessment_criteria"], now, now, dur
        ))

        await db.execute("UPDATE tests SET shuffle_options = ? WHERE id = ?", (test.get("shuffle_options", 0), new_test_id))

        tasks_cur = await db.execute("SELECT * FROM tasks WHERE test_id = ? ORDER BY order_index ASC", (test_id,))
        for t in await tasks_cur.fetchall():
            new_task_id = str(uuid.uuid4())
            await db.execute("""
                INSERT INTO tasks (
                    id, test_id, order_index, question_text, question_type, options_json,
                    max_score, descriptor, check_method, tolerance, answer_key_json,
                    comment_explanation, image_url, image_size, image_align, categories_json, variant, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                new_task_id, new_test_id, t["order_index"], t["question_text"], t["question_type"],
                t["options_json"], t["max_score"], t["descriptor"], t["check_method"], t["tolerance"],
                t["answer_key_json"], t["comment_explanation"], t["image_url"],
                t.get("image_size") or "100%", t.get("image_align") or "center", t.get("categories_json"),
                t.get("variant") or "1", now
            ))

        await db.commit()
    return {"id": new_test_id, "message": "Работа успешно скопирована"}

# --- Tasks Management ---
@app.post("/api/tests/{test_id}/tasks")
async def create_task(test_id: str, task: TaskItem, teacher: dict = Depends(get_current_teacher), after_task_id: Optional[str] = None):
    task_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    async with get_db() as db:
        c = await db.execute("SELECT id FROM tests WHERE id = ? AND teacher_id = ?", (test_id, teacher["id"]))
        if not await c.fetchone():
            raise HTTPException(status_code=404, detail="Работа не найдена")

        c_order = await db.execute("SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM tasks WHERE test_id = ?", (test_id,))
        next_order = (await c_order.fetchone())["next_order"]
        if after_task_id:
            source = await db.execute("SELECT order_index FROM tasks WHERE id = ? AND test_id = ?", (after_task_id, test_id))
            source_row = await source.fetchone()
            if not source_row:
                raise HTTPException(status_code=404, detail="Исходное задание не найдено")
            next_order = source_row["order_index"] + 1
            await db.execute("UPDATE tasks SET order_index = order_index + 1 WHERE test_id = ? AND order_index >= ?", (test_id, next_order))


        await db.execute("""
            INSERT INTO tasks (
                id, test_id, order_index, question_text, question_type, options_json,
                max_score, descriptor, check_method, tolerance, answer_key_json,
                comment_explanation, image_url, image_size, image_align, categories_json, variant, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            task_id, test_id, next_order, task.question_text.strip(), task.question_type,
            json.dumps(task.options or [], ensure_ascii=False), task.max_score, task.descriptor or "",
            task.check_method or "exact", task.tolerance or 0.0,
            json.dumps(task.answer_key, ensure_ascii=False) if task.answer_key is not None else None,
            task.comment_explanation or "", task.image_url,
            task.image_size or "100%", task.image_align or "center",
            json.dumps(task.categories or [], ensure_ascii=False),
            str(task.variant or "1"), now
        ))
        await db.execute("UPDATE tests SET updated_at = ? WHERE id = ?", (now, test_id))
        await sync_launches_for_test(db, test_id)
        await db.commit()
    return {"id": task_id, "order_index": next_order}

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, task: TaskItem, teacher: dict = Depends(get_current_teacher)):
    now = datetime.now().isoformat()
    async with get_db() as db:
        c = await db.execute("""
            SELECT t.id, t.test_id FROM tasks t
            JOIN tests s ON t.test_id = s.id
            WHERE t.id = ? AND s.teacher_id = ?
        """, (task_id, teacher["id"]))
        row = await c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Задание не найдено")

        await db.execute("""
            UPDATE tasks
            SET question_text = ?, question_type = ?, options_json = ?, max_score = ?, descriptor = ?,
                check_method = ?, tolerance = ?, answer_key_json = ?, comment_explanation = ?,
                image_url = ?, image_size = ?, image_align = ?, categories_json = ?, variant = ?
            WHERE id = ?
        """, (
            task.question_text.strip(), task.question_type, json.dumps(task.options or [], ensure_ascii=False),
            task.max_score, task.descriptor or "", task.check_method or "exact",
            task.tolerance or 0.0, json.dumps(task.answer_key, ensure_ascii=False) if task.answer_key is not None else None,
            task.comment_explanation or "", task.image_url,
            task.image_size or "100%", task.image_align or "center",
            json.dumps(task.categories or [], ensure_ascii=False),
            str(task.variant or "1"), task_id
        ))
        await db.execute("UPDATE tests SET updated_at = ? WHERE id = ?", (now, row["test_id"]))
        await sync_launches_for_test(db, row["test_id"])
        await db.commit()
    return {"ok": True}

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str, teacher: dict = Depends(get_current_teacher)):
    async with get_db() as db:
        c = await db.execute("""
            SELECT t.id, t.test_id FROM tasks t
            JOIN tests s ON t.test_id = s.id
            WHERE t.id = ? AND s.teacher_id = ?
        """, (task_id, teacher["id"]))
        row = await c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Задание не найдено")

        test_id = row["test_id"]
        await db.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        
        # Перенумеровываем оставшиеся задания
        c2 = await db.execute("SELECT id FROM tasks WHERE test_id = ? ORDER BY order_index ASC", (test_id,))
        all_tasks = await c2.fetchall()
        for idx, t in enumerate(all_tasks, 1):
            await db.execute("UPDATE tasks SET order_index = ? WHERE id = ?", (idx, t["id"]))

        await db.execute("UPDATE tests SET updated_at = ? WHERE id = ?", (datetime.now().isoformat(), test_id))
        await sync_launches_for_test(db, test_id)
        await db.commit()
    return {"ok": True}

@app.post("/api/tests/{test_id}/tasks/reorder")
async def reorder_tasks(test_id: str, task_ids: List[str], teacher: dict = Depends(get_current_teacher)):
    async with get_db() as db:
        c = await db.execute("SELECT id FROM tests WHERE id = ? AND teacher_id = ?", (test_id, teacher["id"]))
        if not await c.fetchone():
            raise HTTPException(status_code=404, detail="Работа не найдена")

        for idx, t_id in enumerate(task_ids, 1):
            await db.execute("UPDATE tasks SET order_index = ? WHERE id = ? AND test_id = ?", (idx, t_id, test_id))
        await db.execute("UPDATE tests SET updated_at = ? WHERE id = ?", (datetime.now().isoformat(), test_id))
        await sync_launches_for_test(db, test_id)
        await db.commit()
    return {"ok": True}

@app.post("/api/upload/image")
async def upload_task_image(file: UploadFile = File(...), teacher: dict = Depends(get_current_teacher)):
    filename = file.filename or "image.png"
    ext = os.path.splitext(filename)[1].lower()
    allowed_exts = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"}
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Формат файла не поддерживается. Выберите PNG, JPG, JPEG, WebP, GIF или SVG.")

    uploads_dir = os.path.join(BASE_DIR, "static", "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    safe_name = f"{uuid.uuid4().hex[:12]}_{secrets.token_hex(4)}{ext}"
    dest_path = os.path.join(uploads_dir, safe_name)

    contents = await file.read()
    with open(dest_path, "wb") as f:
        f.write(contents)

    rel_url = f"/static/uploads/{safe_name}"
    return {"ok": True, "url": rel_url, "filename": safe_name}

# --- Launches (Запуски и Проведение) ---
@app.post("/api/launches")
async def create_launch(req: CreateLaunchRequest, teacher: dict = Depends(get_current_teacher)):
    launch_id = str(uuid.uuid4())
    now = datetime.now().isoformat()

    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM tests WHERE id = ? AND teacher_id = ?", (req.test_id, teacher["id"]))
        test = await cursor.fetchone()
        if not test:
            raise HTTPException(status_code=404, detail="Шаблон работы не найден")

        # Загружаем задания и фиксируем снимок (snapshot)
        tasks_cur = await db.execute("SELECT * FROM tasks WHERE test_id = ? ORDER BY order_index ASC", (req.test_id,))
        raw_tasks = await tasks_cur.fetchall()
        if not raw_tasks:
            raise HTTPException(status_code=400, detail="Нельзя опубликовать запуск без заданий")

        snapshot_tasks = []
        for rt in raw_tasks:
            t = dict(rt)
            t["options"] = json.loads(t["options_json"]) if t["options_json"] else []
            t["answer_key"] = json.loads(t["answer_key_json"]) if t["answer_key_json"] else None
            t["categories"] = json.loads(t["categories_json"]) if t.get("categories_json") else []
            t["variant"] = t.get("variant") or "1"
            snapshot_tasks.append(t)

        title = req.title.strip() if req.title else test["title"]
        bg = req.bg_color or (test["bg_color"] if "bg_color" in test.keys() and test["bg_color"] else "#f8fafc")
        bg_v1 = req.bg_color_v1 or (test["bg_color_v1"] if "bg_color_v1" in test.keys() and test["bg_color_v1"] else "#fce8e6")
        bg_v2 = req.bg_color_v2 or (test["bg_color_v2"] if "bg_color_v2" in test.keys() and test["bg_color_v2"] else "#e6f4ea")

        await db.execute("""
            INSERT INTO launches (
                id, test_id, teacher_id, title, status, allowed_classes_json, manual_approval,
                duration_minutes, scheduled_start, scheduled_end, timezone, shuffle_questions,
                shuffle_options, allow_back_nav, show_all_at_once, publish_scores,
                publish_answers, publish_comments, bg_color, bg_color_v1, bg_color_v2, snapshot_tasks_json, created_at
            ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            launch_id, req.test_id, teacher["id"], title, json.dumps(req.allowed_classes),
            1 if req.manual_approval else 0, req.duration_minutes, req.scheduled_start,
            req.scheduled_end, req.timezone, 1 if req.shuffle_questions else 0,
            int(bool(test["shuffle_options"]) if req.shuffle_options is None else req.shuffle_options), 1 if req.allow_back_nav else 0,
            1 if req.show_all_at_once else 0, 1 if req.publish_scores else 0,
            1 if req.publish_answers else 0, 1 if req.publish_comments else 0,
            bg, bg_v1, bg_v2, json.dumps(snapshot_tasks, ensure_ascii=False), now
        ))

        # Запись в аудит
        await db.execute("""
            INSERT INTO audit_logs (id, launch_id, action, details_json, created_at)
            VALUES (?, ?, 'create_launch', ?, ?)
        """, (str(uuid.uuid4()), launch_id, json.dumps({"title": title, "classes": req.allowed_classes}), now))

        await db.commit()

    return {"launch_id": launch_id, "status": "draft", "message": "Запуск работы успешно создан"}

@app.get("/api/launches")
async def list_launches(test_id: Optional[str] = None, teacher: dict = Depends(get_current_teacher)):
    remove_lesson_from_database_files(os.path.dirname(BASE_DIR))
    query = "SELECT l.*, t.subject, t.grade_level, t.exam_type FROM launches l JOIN tests t ON l.test_id = t.id WHERE l.teacher_id = ?"
    params = [teacher["id"]]
    if test_id:
        query += " AND l.test_id = ?"
        params.append(test_id)
    query += " ORDER BY l.created_at DESC"

    async with get_db() as db:
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        result = []
        for r in rows:
            ld = dict(r)
            ld["allowed_classes"] = json.loads(ld["allowed_classes_json"])
            # Подсчет статистики учеников
            sc = await db.execute("""
                SELECT 
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
                    SUM(CASE WHEN status IN ('in_waiting', 'waiting_approval') THEN 1 ELSE 0 END) as waiting_count
                FROM student_attempts WHERE launch_id = ?
            """, (ld["id"],))
            stat = await sc.fetchone()
            ld["stats"] = dict(stat)
            result.append(ld)
        return result

@app.get("/api/launches/{launch_id}")
async def get_launch(launch_id: str, request: Request, teacher: dict = Depends(get_current_teacher)):
    async with get_db() as db:
        cursor = await db.execute("""
            SELECT l.*, t.subject, t.grade_level, t.exam_type, t.instructions, t.learning_objectives, t.assessment_criteria
            FROM launches l
            JOIN tests t ON l.test_id = t.id
            WHERE l.id = ? AND l.teacher_id = ?
        """, (launch_id, teacher["id"]))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Запуск не найден")
        
        ld = dict(row)
        ld["allowed_classes"] = json.loads(ld["allowed_classes_json"])
        ld["tasks"] = json.loads(ld["snapshot_tasks_json"])
        ld["bg_color_v1"] = ld.get("bg_color_v1") or "#fce8e6"
        ld["bg_color_v2"] = ld.get("bg_color_v2") or "#e6f4ea"
        ld["server_urls"] = get_teacher_network_urls(request)
        return ld

@app.put("/api/launches/{launch_id}/status")
async def update_launch_status(launch_id: str, req: UpdateLaunchStatusRequest, teacher: dict = Depends(get_current_teacher)):
    valid_statuses = ["draft", "waiting", "active", "closed_entry", "finished"]
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Недопустимый статус проведения")

    now = datetime.now(timezone.utc).isoformat()
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM launches WHERE id = ? AND teacher_id = ?", (launch_id, teacher["id"]))
        launch = await cursor.fetchone()
        if not launch:
            raise HTTPException(status_code=404, detail="Запуск не найден")

        old_status = launch["status"]

        # Если статус меняется на finished, подсчитываем незавершенные попытки и завершаем их с последними принятыми ответами
        unfinished_count = 0
        if req.status == "finished":
            unf_cur = await db.execute("SELECT id FROM student_attempts WHERE launch_id = ? AND status = 'in_progress'", (launch_id,))
            unf_attempts = await unf_cur.fetchall()
            unfinished_count = len(unf_attempts)
            
            for u in unf_attempts:
                conf_code = f"BAG-{datetime.now().strftime('%Y')}-{secrets.token_hex(3).upper()}"
                await db.execute("""
                    UPDATE student_attempts
                    SET status = 'submitted', submitted_at = ?, confirmation_code = ?
                    WHERE id = ?
                """, (now, conf_code, u["id"]))
                await auto_grade_attempt(db, u["id"], launch["snapshot_tasks_json"])

        started_at = launch["started_at"]
        if req.status == "active":
            if not started_at:
                started_at = now
            if not launch["manual_approval"]:
                await db.execute("UPDATE student_attempts SET status = 'approved' WHERE launch_id = ? AND status = 'in_waiting'", (launch_id,))
        elif req.status == "waiting":
            await db.execute("UPDATE student_attempts SET status = 'in_waiting' WHERE launch_id = ? AND status = 'approved'", (launch_id,))

        finished_at = now if req.status == "finished" else launch["finished_at"]

        await db.execute("""
            UPDATE launches
            SET status = ?, started_at = ?, finished_at = ?
            WHERE id = ?
        """, (req.status, started_at, finished_at, launch_id))

        # Лог аудита
        await db.execute("""
            INSERT INTO audit_logs (id, launch_id, action, details_json, created_at)
            VALUES (?, ?, 'change_status', ?, ?)
        """, (str(uuid.uuid4()), launch_id, json.dumps({"from": old_status, "to": req.status, "unfinished_fixed": unfinished_count}), now))

        await db.commit()

    # Оповещаем подписчиков SSE
    broadcast_live_event(launch_id, "launch_status_changed", {"status": req.status, "unfinished_fixed": unfinished_count})
    return {"status": req.status, "unfinished_fixed": unfinished_count}

@app.put("/api/launches/{launch_id}/settings")
async def update_launch_settings(launch_id: str, req: UpdateLaunchSettingsRequest, teacher: dict = Depends(get_current_teacher)):
    async with get_db() as db:
        cursor = await db.execute("SELECT * FROM launches WHERE id = ? AND teacher_id = ?", (launch_id, teacher["id"]))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Запуск не найден")

        updates = []
        params = []
        if req.manual_approval is not None:
            updates.append("manual_approval = ?")
            params.append(1 if req.manual_approval else 0)
        if req.duration_minutes is not None:
            updates.append("duration_minutes = ?")
            params.append(req.duration_minutes)
        if req.publish_scores is not None:
            updates.append("publish_scores = ?")
            params.append(1 if req.publish_scores else 0)
        if req.publish_answers is not None:
            updates.append("publish_answers = ?")
            params.append(1 if req.publish_answers else 0)
        if req.publish_comments is not None:
            updates.append("publish_comments = ?")
            params.append(1 if req.publish_comments else 0)
        if req.bg_color is not None:
            updates.append("bg_color = ?")
            params.append(req.bg_color)
        if req.bg_color_v1 is not None:
            updates.append("bg_color_v1 = ?")
            params.append(req.bg_color_v1)
        if req.bg_color_v2 is not None:
            updates.append("bg_color_v2 = ?")
            params.append(req.bg_color_v2)

        if updates:
            params.append(launch_id)
            await db.execute(f"UPDATE launches SET {', '.join(updates)} WHERE id = ?", params)

            # Если изменена продолжительность, пересчитываем дедлайн для учеников, решающих работу сейчас
            if req.duration_minutes is not None:
                cur_active = await db.execute(
                    "SELECT id, started_at, extra_time_minutes FROM student_attempts WHERE launch_id = ? AND status = 'in_progress' AND started_at IS NOT NULL",
                    (launch_id,)
                )
                active_atts = await cur_active.fetchall()
                for att in active_atts:
                    try:
                        st_dt = datetime.fromisoformat(att["started_at"])
                        if st_dt.tzinfo is None:
                            st_dt = st_dt.replace(tzinfo=timezone.utc)
                        tot_m = req.duration_minutes + (att["extra_time_minutes"] or 0)
                        new_dl = (st_dt + timedelta(minutes=tot_m)).isoformat() if tot_m > 0 else None
                        await db.execute("UPDATE student_attempts SET server_deadline = ? WHERE id = ?", (new_dl, att["id"]))
                    except Exception:
                        pass

            await db.commit()

    broadcast_live_event(launch_id, "launch_settings_updated", {"updated": True})
    return {"ok": True}

@app.delete("/api/launches/{launch_id}")
async def delete_launch(launch_id: str, teacher: dict = Depends(get_current_teacher)):
    async with get_db() as db:
        c = await db.execute("SELECT id FROM launches WHERE id = ? AND teacher_id = ?", (launch_id, teacher["id"]))
        if not await c.fetchone():
            raise HTTPException(status_code=404, detail="Запуск не найден")
        
        await db.execute("DELETE FROM student_answers WHERE attempt_id IN (SELECT id FROM student_attempts WHERE launch_id = ?)", (launch_id,))
        await db.execute("DELETE FROM student_attempts WHERE launch_id = ?", (launch_id,))
        await db.execute("DELETE FROM audit_logs WHERE launch_id = ?", (launch_id,))
        await db.execute("DELETE FROM launches WHERE id = ?", (launch_id,))
        await db.commit()
    cleanup_site_lessons_for_launches(os.path.dirname(BASE_DIR), [launch_id])
    return {"deleted": True, "message": "Сессия проведения успешно удалена"}

@app.delete("/api/launches/{launch_id}/students/{attempt_id}")
async def delete_student_attempt_endpoint(
    launch_id: str,
    attempt_id: str,
    permanent: bool = Query(False),
    teacher: dict = Depends(get_current_teacher)
):
    async with get_db() as db:
        await db.execute("BEGIN IMMEDIATE")
        c = await db.execute("""
            SELECT sa.* FROM student_attempts sa JOIN launches l ON l.id = sa.launch_id
            WHERE sa.id = ? AND l.id = ? AND l.teacher_id = ?
        """, (attempt_id, launch_id, teacher["id"]))
        attempt = await c.fetchone()
        if not attempt:
            raise HTTPException(status_code=404, detail="Попытка не найдена")

        await record_retake_permission(db, launch_id, attempt)
        
        if permanent:
            await db.execute("DELETE FROM student_answers WHERE attempt_id = ?", (attempt_id,))
            await db.execute("DELETE FROM student_attempts WHERE id = ? AND launch_id = ?", (attempt_id, launch_id))
        else:
            # Keep the attempt and its answers as a result record. Mark it
            # removed from the live roster so the identity/IP can be reused.
            removed_at = datetime.now(timezone.utc).isoformat()
            await db.execute("""
                UPDATE student_attempts
                SET status = 'removed', submitted_at = COALESCE(submitted_at, ?),
                    server_deadline = NULL,
                    confirmation_code = COALESCE(confirmation_code, ?)
                WHERE id = ? AND launch_id = ?
            """, (removed_at, f"REM-{secrets.token_hex(3).upper()}", attempt_id, launch_id))
        await db.commit()
    
    broadcast_live_event(launch_id, "student_removed", {"attempt_id": attempt_id})
    return {"ok": True, "message": "Попытка ученика успешно удалена"}


HOSTNAME_CACHE: Dict[str, str] = {}

def get_device_info(ip: Optional[str]) -> str:
    if not ip or ip in ("127.0.0.1", "::1", "testclient"):
        return "Локально"
    if ip in HOSTNAME_CACHE:
        return HOSTNAME_CACHE[ip]

    # Reverse DNS on school networks can take seconds per PC and blocks the
    # entire async server (including joining, saving and submitting answers).
    import ipaddress
    try:
        is_tailscale = ipaddress.ip_address(ip) in ipaddress.ip_network("100.64.0.0/10")
    except ValueError:
        is_tailscale = False
    label = f"{ip} (Tailscale)" if is_tailscale else ip

    HOSTNAME_CACHE[ip] = label
    return label

# --- Мониторинг в реальном времени и управление участниками ---
@app.get("/api/launches/{launch_id}/students")
async def get_launch_students(launch_id: str, teacher: dict = Depends(get_current_teacher)):
    async with get_db() as db:
        c = await db.execute("SELECT snapshot_tasks_json FROM launches WHERE id = ? AND teacher_id = ?", (launch_id, teacher["id"]))
        launch_row = await c.fetchone()
        if not launch_row:
            raise HTTPException(status_code=404, detail="Запуск не найден")

        tasks = json.loads(launch_row["snapshot_tasks_json"])
        task_count = len(tasks)

        # Выбираем попытки
        cur = await db.execute("""
            SELECT sa.*, 
                   COUNT(CASE WHEN ans.answer_json IS NOT NULL AND ans.answer_json != '""' AND ans.answer_json != 'null' THEN 1 END) as answered_count,
                   SUM(COALESCE(ans.final_score, 0)) as total_score
            FROM student_attempts sa
            LEFT JOIN student_answers ans ON sa.id = ans.attempt_id
            WHERE sa.launch_id = ? AND sa.status != 'removed'
            GROUP BY sa.id
            ORDER BY sa.created_at DESC
        """, (launch_id,))
        attempts = await cur.fetchall()

        now_utc = datetime.now(timezone.utc)
        result = []
        for att in attempts:
            d = dict(att)
            # Определение статуса соединения
            is_online = False
            last_hb_str = d.get("last_heartbeat")
            if last_hb_str:
                try:
                    hb_dt = datetime.fromisoformat(last_hb_str)
                    if hb_dt.tzinfo is None:
                        hb_dt = hb_dt.replace(tzinfo=timezone.utc)
                    diff = (now_utc - hb_dt).total_seconds()
                    if diff <= 25:
                        is_online = True
                except Exception:
                    pass
            d["is_online"] = is_online
            stu_var = str(d.get("variant") or "1")
            stu_task_count = len([t for t in tasks if str(t.get("variant", "1")) in (stu_var, "all", "1,2")])
            if stu_task_count == 0:
                stu_task_count = task_count
            d["variant"] = stu_var
            d["task_count"] = stu_task_count
            d["total_score"] = round(float(d.get("total_score") or 0.0), 1)
            d["progress_pct"] = round((d["answered_count"] / stu_task_count * 100), 1) if stu_task_count > 0 else 0
            d["device_label"] = get_device_info(d.get("ip_address"))
            result.append(d)

        return result

@app.post("/api/launches/{launch_id}/students/{attempt_id}/action")
async def teacher_student_action(
    launch_id: str,
    attempt_id: str,
    req: TeacherActionStudentRequest,
    teacher: dict = Depends(get_current_teacher)
):
    now = datetime.now().isoformat()
    async with get_db() as db:
        c = await db.execute("SELECT l.snapshot_tasks_json, sa.* FROM student_attempts sa JOIN launches l ON sa.launch_id = l.id WHERE sa.id = ? AND l.id = ? AND l.teacher_id = ?", (attempt_id, launch_id, teacher["id"]))
        row = await c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Попытка не найдена")

        action = req.action

        if action == "admit":
            await db.execute("UPDATE student_attempts SET status = 'approved' WHERE id = ?", (attempt_id,))
        elif action == "remove":
            await record_retake_permission(db, launch_id, row)
            removed_at = datetime.now(timezone.utc).isoformat()
            await db.execute("""
                UPDATE student_attempts
                SET status = 'removed', submitted_at = COALESCE(submitted_at, ?),
                    server_deadline = NULL,
                    confirmation_code = COALESCE(confirmation_code, ?)
                WHERE id = ?
            """, (removed_at, f"REM-{secrets.token_hex(3).upper()}", attempt_id))
        elif action == "block":
            await db.execute("UPDATE student_attempts SET status = 'blocked' WHERE id = ?", (attempt_id,))
        elif action == "unblock":
            await db.execute("UPDATE student_attempts SET status = 'in_progress' WHERE id = ?", (attempt_id,))
        elif action == "add_time":
            extra = int(req.extra_minutes or 5)
            # Продлеваем серверный дедлайн
            current_dl = row["server_deadline"]
            if current_dl:
                try:
                    dt = datetime.fromisoformat(current_dl)
                    new_dt = dt + timedelta(minutes=extra)
                    await db.execute("""
                        UPDATE student_attempts
                        SET server_deadline = ?, extra_time_minutes = extra_time_minutes + ?
                        WHERE id = ?
                    """, (new_dt.isoformat(), extra, attempt_id))
                except Exception as e:
                    logger.error("Failed to parse deadline: %s", e)
        elif action == "allow_extra_attempt":
            await db.execute("UPDATE student_attempts SET allow_extra_attempt = 1 WHERE id = ?", (attempt_id,))
        elif action == "reset_session":
            # Выдача нового токена для восстановления доступа при смене устройства
            new_token = secrets.token_urlsafe(32)
            await db.execute("UPDATE student_attempts SET attempt_token = ? WHERE id = ?", (new_token, attempt_id))
            await db.commit()
            recovery_url = f"/exam/{launch_id}?recovery_token={new_token}"
            return {"ok": True, "recovery_url": recovery_url, "new_token": new_token}

        # Лог аудита
        await db.execute("""
            INSERT INTO audit_logs (id, launch_id, action, details_json, created_at)
            VALUES (?, ?, 'student_action', ?, ?)
        """, (str(uuid.uuid4()), launch_id, json.dumps({"attempt_id": attempt_id, "action": action, "extra_minutes": req.extra_minutes}), now))

        await db.commit()

    broadcast_live_event(launch_id, "student_action_applied", {"attempt_id": attempt_id, "action": req.action})
    return {"ok": True}

# SSE Stream для живого мониторинга
@app.get("/api/launches/{launch_id}/stream")
async def live_stream(launch_id: str, token: Optional[str] = Query(None), request: Request = None):
    # Проверяем авторизацию учителя
    teacher_token = token or request.cookies.get("bagalau_teacher_session")
    if not teacher_token or teacher_token not in TEACHER_SESSIONS:
        raise HTTPException(status_code=401, detail="Unauthorized")

    queue = asyncio.Queue()
    if launch_id not in LIVE_STREAMS:
        LIVE_STREAMS[launch_id] = []
    LIVE_STREAMS[launch_id].append(queue)

    async def event_generator():
        try:
            # Сразу отправляем приветственный пинг
            yield f"event: connected\ndata: {json.dumps({'status': 'connected'})}\n\n"
            while True:
                msg = await queue.get()
                yield f"data: {msg}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if launch_id in LIVE_STREAMS and queue in LIVE_STREAMS[launch_id]:
                LIVE_STREAMS[launch_id].remove(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# --- Проверка ответов и оценивание (Grading) ---
@app.get("/api/launches/{launch_id}/grading")
async def get_launch_grading_data(launch_id: str, teacher: dict = Depends(get_current_teacher)):
    async with get_db() as db:
        c = await db.execute("SELECT snapshot_tasks_json FROM launches WHERE id = ? AND teacher_id = ?", (launch_id, teacher["id"]))
        row = await c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Запуск не найден")

        tasks = json.loads(row["snapshot_tasks_json"])

        cur_att = await db.execute("SELECT * FROM student_attempts WHERE launch_id = ? ORDER BY student_name ASC", (launch_id,))
        attempts = [dict(a) for a in await cur_att.fetchall()]

        cur_ans = await db.execute("""
            SELECT ans.* FROM student_answers ans
            JOIN student_attempts sa ON ans.attempt_id = sa.id
            WHERE sa.launch_id = ?
        """, (launch_id,))
        answers = [dict(a) for a in await cur_ans.fetchall()]

        # Группируем ответы по attempt_id
        answers_by_attempt = {}
        for a in answers:
            att_id = a["attempt_id"]
            if att_id not in answers_by_attempt:
                answers_by_attempt[att_id] = {}
            if a["answer_json"]:
                try:
                    a["answer_parsed"] = json.loads(a["answer_json"])
                except Exception:
                    a["answer_parsed"] = a["answer_json"]
            answers_by_attempt[att_id][a["task_id"]] = a

        # Подсчитываем точный итоговый балл каждого ученика
        for att in attempts:
            stu_answers = answers_by_attempt.get(att["id"], {})
            tot = sum(float(a.get("final_score") if a.get("final_score") is not None else 0.0) for a in stu_answers.values())
            att["total_score"] = round(tot, 1)

        cur_launch = await db.execute("""
            SELECT l.*, t.quarter, t.subject, t.grade_level, t.exam_type
            FROM launches l
            JOIN tests t ON l.test_id = t.id
            WHERE l.id = ? AND l.teacher_id = ?
        """, (launch_id, teacher["id"]))
        l_row = await cur_launch.fetchone()
        launch_meta = dict(l_row) if l_row else {}

        return {
            "launch": launch_meta,
            "tasks": tasks,
            "attempts": attempts,
            "answers_by_attempt": answers_by_attempt
        }

@app.post("/api/launches/{launch_id}/grade")
async def grade_single_answer(launch_id: str, req: GradeSingleAnswerRequest, teacher: dict = Depends(get_current_teacher)):
    now = datetime.now().isoformat()
    async with get_db() as db:
        # Проверяем принадлежность запуска
        c = await db.execute("SELECT id FROM launches WHERE id = ? AND teacher_id = ?", (launch_id, teacher["id"]))
        if not await c.fetchone():
            raise HTTPException(status_code=404, detail="Запуск не найден")

        # Обновляем или вставляем оценку учителя
        cursor = await db.execute("SELECT id FROM student_answers WHERE attempt_id = ? AND task_id = ?", (req.attempt_id, req.task_id))
        ans_row = await cursor.fetchone()
        if ans_row:
            await db.execute("""
                UPDATE student_answers
                SET manual_score = ?, final_score = ?, teacher_comment = ?, is_graded = 1, updated_at = ?
                WHERE id = ?
            """, (req.score, req.score, req.teacher_comment or "", now, ans_row["id"]))
        else:
            ans_id = str(uuid.uuid4())
            await db.execute("""
                INSERT INTO student_answers (id, attempt_id, task_id, answer_json, version, manual_score, final_score, teacher_comment, is_graded, updated_at)
                VALUES (?, ?, ?, NULL, 1, ?, ?, ?, 1, ?)
            """, (ans_id, req.attempt_id, req.task_id, req.score, req.score, req.teacher_comment or "", now))

        await db.commit()

    broadcast_live_event(launch_id, "score_updated", {"attempt_id": req.attempt_id, "task_id": req.task_id, "score": req.score})
    return {"ok": True}

# Экспорт результатов в Excel и CSV
@app.get("/api/launches/{launch_id}/export.xlsx")
async def export_xlsx(launch_id: str, teacher: dict = Depends(get_current_teacher)):
    async with get_db() as db:
        c = await db.execute("""
            SELECT l.*, t.subject, t.grade_level, t.exam_type 
            FROM launches l JOIN tests t ON l.test_id = t.id 
            WHERE l.id = ? AND l.teacher_id = ?
        """, (launch_id, teacher["id"]))
        launch_row = await c.fetchone()
        if not launch_row:
            raise HTTPException(status_code=404, detail="Запуск не найден")

        tasks = json.loads(launch_row["snapshot_tasks_json"])
        cur_att = await db.execute("SELECT * FROM student_attempts WHERE launch_id = ? ORDER BY student_class ASC, student_name ASC", (launch_id,))
        attempts = [dict(a) for a in await cur_att.fetchall()]

        cur_ans = await db.execute("SELECT * FROM student_answers WHERE attempt_id IN (SELECT id FROM student_attempts WHERE launch_id = ?)", (launch_id,))
        raw_ans = await cur_ans.fetchall()
        answers_by_attempt = {}
        for a in raw_ans:
            answers_by_attempt.setdefault(a["attempt_id"], {})[a["task_id"]] = dict(a)

        for att in attempts:
            stu_answers = answers_by_attempt.get(att["id"], {})
            tot = sum(float(a.get("final_score") if a.get("final_score") is not None else 0.0) for a in stu_answers.values())
            att["total_score"] = round(tot, 1)

        from urllib.parse import quote
        xlsx_bytes = generate_excel_report(dict(launch_row), attempts, tasks, answers_by_attempt)
        filename = f"Results_{launch_row['title'].replace(' ', '_')}.xlsx"
        encoded_fn = quote(filename)
        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_fn}"}
        )

@app.get("/api/launches/{launch_id}/export.csv")
async def export_csv(launch_id: str, teacher: dict = Depends(get_current_teacher)):
    async with get_db() as db:
        c = await db.execute("""
            SELECT l.*, t.subject, t.grade_level, t.exam_type 
            FROM launches l JOIN tests t ON l.test_id = t.id 
            WHERE l.id = ? AND l.teacher_id = ?
        """, (launch_id, teacher["id"]))
        launch_row = await c.fetchone()
        if not launch_row:
            raise HTTPException(status_code=404, detail="Запуск не найден")

        tasks = json.loads(launch_row["snapshot_tasks_json"])
        cur_att = await db.execute("SELECT * FROM student_attempts WHERE launch_id = ? ORDER BY student_class ASC, student_name ASC", (launch_id,))
        attempts = [dict(a) for a in await cur_att.fetchall()]

        cur_ans = await db.execute("SELECT * FROM student_answers WHERE attempt_id IN (SELECT id FROM student_attempts WHERE launch_id = ?)", (launch_id,))
        raw_ans = await cur_ans.fetchall()
        answers_by_attempt = {}
        for a in raw_ans:
            answers_by_attempt.setdefault(a["attempt_id"], {})[a["task_id"]] = dict(a)

        for att in attempts:
            stu_answers = answers_by_attempt.get(att["id"], {})
            tot = sum(float(a.get("final_score") if a.get("final_score") is not None else 0.0) for a in stu_answers.values())
            att["total_score"] = round(tot, 1)

        from urllib.parse import quote
        csv_str = generate_csv_report(dict(launch_row), attempts, tasks, answers_by_attempt)
        filename = f"Results_{launch_row['title'].replace(' ', '_')}.csv"
        encoded_fn = quote(filename)
        return Response(
            content=csv_str.encode("utf-8-sig"),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_fn}"}
        )

# --- Бэкапы и Восстановление ---
@app.get("/api/backup/list")
async def get_backups(teacher: dict = Depends(get_current_teacher)):
    return list_backups()

@app.post("/api/backup/create")
async def trigger_backup(req: Optional[CreateBackupRequest] = None, teacher: dict = Depends(get_current_teacher)):
    name = req.name if req else None
    filename = create_backup(name)
    return {"ok": True, "filename": filename}

@app.delete("/api/backup/{filename}")
async def trigger_delete_backup(filename: str, teacher: dict = Depends(get_current_teacher)):
    try:
        delete_backup(filename)
        return {"ok": True, "message": f"Резервная копия {filename} успешно удалена"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/backup/restore")
async def trigger_restore(backup_name: str = Query(...), teacher: dict = Depends(get_current_teacher)):
    restore_backup(backup_name)
    return {"ok": True, "message": f"База данных успешно восстановлена из {backup_name}"}

# =========================================================================
# УЧЕНИЧЕСКИЕ ЭНДПОИНТЫ (СТРОГО БЕЗ КЛЮЧЕЙ ОТВЕТОВ)
# =========================================================================

@app.get("/api/student/check/{launch_id}")
async def student_check_launch(launch_id: str):
    """Публичная информация о работе для страницы ожидания / входа (БЕЗ ЗАДАНИЙ!)"""
    async with get_db() as db:
        cursor = await db.execute("""
            SELECT l.id, l.title, l.status, l.allowed_classes_json, l.duration_minutes,
                   l.timezone, l.scheduled_start, l.scheduled_end, l.manual_approval,
                   l.bg_color, l.bg_color_v1, l.bg_color_v2, l.snapshot_tasks_json,
                   t.subject, t.grade_level, t.exam_type, t.instructions, t.class_letters_json,
                   (SELECT COUNT(*) FROM tasks WHERE test_id = l.test_id) as task_count,
                   (SELECT COALESCE(SUM(max_score), 0) FROM tasks WHERE test_id = l.test_id) as total_max_score
            FROM launches l
            JOIN tests t ON l.test_id = t.id
            WHERE l.id = ?
        """, (launch_id,))
        launch = await cursor.fetchone()
        if not launch:
            raise HTTPException(status_code=404, detail="Работа не найдена. Проверьте адрес ссылки.")

        ld = dict(launch)
        ld["allowed_classes"] = json.loads(ld["allowed_classes_json"])
        ld["class_letters"] = json.loads(ld["class_letters_json"]) if ld.get("class_letters_json") else []
        ld["bg_color_v1"] = ld.get("bg_color_v1") or "#fce8e6"
        ld["bg_color_v2"] = ld.get("bg_color_v2") or "#e6f4ea"
        del ld["allowed_classes_json"]

        snap_tasks = []
        if ld.get("snapshot_tasks_json"):
            try:
                snap_tasks = json.loads(ld["snapshot_tasks_json"])
            except Exception:
                snap_tasks = []
            del ld["snapshot_tasks_json"]

        v1_tasks = [t for t in snap_tasks if str(t.get("variant") or "1") in ("1", "all", "1,2")]
        v2_tasks = [t for t in snap_tasks if str(t.get("variant") or "1") in ("2", "all", "1,2")]

        ld["task_count_v1"] = len(v1_tasks) if v1_tasks else ld.get("task_count", 0)
        ld["max_score_v1"] = round(sum(float(t.get("max_score", 1.0)) for t in v1_tasks), 2) if v1_tasks else ld.get("total_max_score", 0)
        ld["task_count_v2"] = len(v2_tasks) if v2_tasks else ld.get("task_count", 0)
        ld["max_score_v2"] = round(sum(float(t.get("max_score", 1.0)) for t in v2_tasks), 2) if v2_tasks else ld.get("total_max_score", 0)
        ld["task_count"] = ld["task_count_v1"]
        ld["total_max_score"] = ld["max_score_v1"]

        return ld


def is_class_allowed(student_class: str, allowed_classes: list) -> bool:
    if not allowed_classes:
        return True
    s = student_class.strip().upper()
    for a in allowed_classes:
        a_str = a.strip().upper()
        if not a_str:
            continue
        if s == a_str:
            return True
        # Если разрешено "10 ЕМН", а ученик выбрал "10 ЕМН А"
        if s.startswith(a_str + " ") or s == a_str:
            return True
        # Если ученик "10 ЕМН А", а разрешено "10 А" или "10"
        s_parts = s.split()
        a_parts = a_str.split()
        if s_parts and a_parts:
            if s_parts[0] == a_parts[0]:
                if len(a_parts) > 1 and len(s_parts) > 1:
                    if a_parts[-1] == s_parts[-1]:
                        return True
                else:
                    return True
    return False


REJOIN_COOLDOWN = timedelta(minutes=20)


async def record_retake_permission(db, launch_id: str, attempt):
    # Reuse the audit table: a teacher deletion grants one new registration even
    # if other students are still using the same public IP. No schema migration.
    await db.execute("""
        INSERT INTO audit_logs (id, launch_id, action, details_json, created_at)
        VALUES (?, ?, 'student_retake_allowed', ?, ?)
    """, (str(uuid.uuid4()), launch_id, json.dumps({
        "attempt_id": attempt["id"],
        "identity": [normalize_student_identity(attempt["student_name"]),
                     normalize_student_identity(attempt["student_class"])],
    }), datetime.now().isoformat()))


def normalize_student_identity(value: str) -> str:
    # SQLite LOWER does not case-fold Cyrillic; also ignore repeated spaces.
    return " ".join(unicodedata.normalize("NFKC", value).casefold().split())


def recent_attempt_from_ip(attempt, client_ip: Optional[str], now: datetime) -> bool:
    if not client_ip or attempt["ip_address"] != client_ip:
        return False
    for field in ("created_at", "started_at", "submitted_at"):
        value = attempt[field]
        if not value:
            continue
        try:
            # Legacy timestamps are server-local; newer start times include UTC.
            when = datetime.fromisoformat(value).astimezone(timezone.utc)
        except (TypeError, ValueError):
            return True
        if now - when < REJOIN_COOLDOWN:
            return True
    return False


def student_join_response(response: Response, attempt, launch_id: str):
    token = attempt["attempt_token"]
    response.set_cookie("bagalau_student_token", token, httponly=True,
                        samesite="lax", max_age=86400)
    # Logout clears the working session, but must not permit a new variant.
    # A per-launch path avoids mixing different exams in the same browser.
    response.set_cookie("bagalau_join_guard", token, httponly=True,
                        samesite="lax", max_age=86400,
                        path=f"/api/student/join/{launch_id}")
    return {key: attempt[key] for key in (
        "attempt_token", "status", "student_name", "student_class", "variant"
    )} | {"attempt_id": attempt["id"]}


@app.post("/api/student/join/{launch_id}")
async def student_join(launch_id: str, req: StudentJoinRequest, request: Request, response: Response):
    student_name = req.student_name.strip()
    student_class = req.student_class.strip()
    student_variant = str(req.variant or "1")

    if not student_name or not student_class:
        raise HTTPException(status_code=400, detail="Укажите фамилию, имя и класс")

    client_ip = request.client.host if request.client else None
    tokens = {token for token in (
        request.headers.get("X-Attempt-Token"),
        request.cookies.get("bagalau_student_token"),
        request.cookies.get("bagalau_join_guard"),
    ) if token}
    identity = (normalize_student_identity(student_name), normalize_student_identity(student_class))

    async with get_db() as db:
        # Serialize the check and insertion so simultaneous joins cannot bypass it.
        # No network operations or schema changes occur inside this transaction.
        await db.execute("BEGIN IMMEDIATE")
        cursor = await db.execute("SELECT * FROM launches WHERE id = ?", (launch_id,))
        launch = await cursor.fetchone()
        if not launch:
            raise HTTPException(status_code=404, detail="Работа не найдена")

        allowed_classes = json.loads(launch["allowed_classes_json"])
        if not is_class_allowed(student_class, allowed_classes):
            raise HTTPException(status_code=400, detail=f"Класс '{student_class}' не входит в список разрешённых для данной работы")

        launch_status = launch["status"]
        if launch_status == "draft":
            raise HTTPException(status_code=403, detail="Работа ещё находится в режиме подготовки учителя")
        if launch_status == "closed_entry":
            raise HTTPException(status_code=403, detail="Вход на работу уже закрыт учителем")
        if launch_status == "finished":
            raise HTTPException(status_code=403, detail="Проведение работы уже завершено")

        cursor = await db.execute("""
            SELECT * FROM student_attempts WHERE launch_id = ?
            ORDER BY created_at DESC, rowid DESC
        """, (launch_id,))
        attempts = await cursor.fetchall()
        matching = [a for a in attempts if a["status"] != "removed" and (a["attempt_token"] in tokens or (
            normalize_student_identity(a["student_name"]),
            normalize_student_identity(a["student_class"])
        ) == identity)]
        extra_allowed = False
        if matching:
            existing = matching[0]
            same_identity = (
                normalize_student_identity(existing["student_name"]),
                normalize_student_identity(existing["student_class"])
            ) == identity
            if not same_identity:
                raise HTTPException(status_code=409, detail="В этом браузере уже зарегистрирована попытка. Для нового входа обратитесь к учителю: он должен удалить попытку и разрешить пересдачу.")
            if existing["allow_extra_attempt"] == 1:
                extra_allowed = True
                await db.execute("UPDATE student_attempts SET allow_extra_attempt = 0 WHERE id = ?", (existing["id"],))
            elif str(existing["variant"] or "1") != student_variant:
                raise HTTPException(status_code=409, detail="Вариант уже закреплён за вашей попыткой. Сменить вариант можно только после удаления попытки учителем.")
            elif existing["attempt_token"] in tokens:
                # A retry/refresh resumes the original attempt, deadline and receipt.
                return student_join_response(response, existing, launch_id)
            else:
                raise HTTPException(status_code=409, detail="Для этого ученика уже есть попытка. Пересдача возможна только с разрешения учителя. Обратитесь к учителю для восстановления доступа или удаления попытки.")

        if not matching:
            permissions = await db.execute("""
                SELECT id, details_json FROM audit_logs
                WHERE launch_id = ? AND action = 'student_retake_allowed'
                ORDER BY created_at DESC
            """, (launch_id,))
            for permission in await permissions.fetchall():
                if tuple(json.loads(permission["details_json"]).get("identity", [])) == identity:
                    extra_allowed = True
                    await db.execute("UPDATE audit_logs SET action = 'student_retake_used' WHERE id = ?", (permission["id"],))
                    break

        now_utc = datetime.now(timezone.utc)
        ip_review_required = not extra_allowed and any(
            recent_attempt_from_ip(a, client_ip, now_utc) for a in attempts
        )
        is_duplicate = 1 if ip_review_required else 0

        # Определяем начальный статус попытки
        # Internet users may share one NAT address. Do not grant a second variant
        # automatically, but let the teacher admit a genuinely different student.
        manual_appr = bool(launch["manual_approval"]) or ip_review_required
        if launch_status == "waiting":
            init_status = "waiting_approval" if manual_appr else "in_waiting"
        elif launch_status == "active":
            init_status = "waiting_approval" if manual_appr else "approved"
        else:
            init_status = "in_waiting"

        attempt_id = str(uuid.uuid4())
        attempt_token = secrets.token_urlsafe(32)
        now = datetime.now().isoformat()
        user_agent = request.headers.get("user-agent", "")
        desk_input = (req.desk_number or "").strip()
        auto_device = get_device_info(client_ip)
        final_device = f"{desk_input} • {auto_device}" if desk_input else auto_device

        await db.execute("""
            INSERT INTO student_attempts (
                id, launch_id, student_name, student_class, variant, attempt_token, status,
                ip_address, user_agent, is_duplicate_flag, device_name, last_heartbeat, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            attempt_id, launch_id, student_name, student_class, student_variant, attempt_token, init_status,
            client_ip, user_agent, is_duplicate, final_device, now, now
        ))
        await db.commit()

    broadcast_live_event(launch_id, "student_joined", {
        "attempt_id": attempt_id,
        "student_name": student_name,
        "student_class": student_class,
        "variant": student_variant,
        "status": init_status,
        "is_duplicate": is_duplicate,
        "device_label": final_device
    })

    return student_join_response(response, {
        "id": attempt_id,
        "attempt_token": attempt_token,
        "status": init_status,
        "student_name": student_name,
        "student_class": student_class,
        "variant": student_variant
    }, launch_id)

@app.get("/api/student/attempt")
async def get_student_attempt(attempt: dict = Depends(get_current_student_attempt)):
    """
    Возвращает данные текущей попытки и ЗАДАНИЯ БЕЗ ПРАВИЛЬНЫХ ОТВЕТОВ!
    Если работа еще не активна или ученик в ожидании, задания НЕ возвращаются.
    """
    status = attempt["status"]
    launch_status = attempt["launch_status"]
    student_var = str(attempt.get("variant") or "1")

    response_data = {
        "attempt_id": attempt["id"],
        "launch_id": attempt["launch_id"],
        "student_name": attempt["student_name"],
        "student_class": attempt["student_class"],
        "variant": student_var,
        "status": status,
        "launch_status": launch_status,
        "server_deadline": attempt.get("server_deadline"),
        "extra_time_minutes": attempt.get("extra_time_minutes", 0),
        "duration_minutes": attempt.get("duration_minutes", 0),
        "confirmation_code": attempt.get("confirmation_code"),
        "show_all_at_once": bool(attempt.get("show_all_at_once", 1)),
        "allow_back_nav": bool(attempt.get("allow_back_nav", 1)),
        "tasks": [],
        "answers": {}
    }

    # Если работа в режиме ожидания (не активна), не отдаём задания
    if launch_status != "active" and status not in ["submitted", "time_expired", "blocked"]:
        response_data["status"] = "waiting_approval" if status == "waiting_approval" else "in_waiting"
        return response_data

    # Если статус не позволяет проходить, задания не отправляем
    if status in ["in_waiting", "waiting_approval", "blocked"]:
        if status == "in_waiting" and launch_status == "active":
            status = "approved"
            response_data["status"] = "approved"
        else:
            return response_data

    # Загружаем задания из снимка запуска
    async with get_db() as db:
        c = await db.execute("SELECT snapshot_tasks_json, bg_color, bg_color_v1, bg_color_v2, shuffle_options, shuffle_questions FROM launches WHERE id = ?", (attempt["launch_id"],))
        lrow = await c.fetchone()
        if not lrow:
            raise HTTPException(status_code=404, detail="Launch not found")
        
        full_tasks = json.loads(lrow["snapshot_tasks_json"])
        bg_v1 = lrow["bg_color_v1"] if "bg_color_v1" in lrow.keys() and lrow["bg_color_v1"] else "#fce8e6"
        bg_v2 = lrow["bg_color_v2"] if "bg_color_v2" in lrow.keys() and lrow["bg_color_v2"] else "#e6f4ea"
        chosen_bg = bg_v2 if student_var == "2" else bg_v1
        response_data["bg_color"] = chosen_bg
        response_data["bg_color_v1"] = bg_v1
        response_data["bg_color_v2"] = bg_v2
        
        # ФОРМИРУЕМ БЕЗОПАСНЫЙ УЧЕНИЧЕСКИЙ СПИСОК (БЕЗ answer_key и comment_explanation!)
        # Фильтруем задания строго по выбранному варианту ученика
        filtered_tasks = []
        for t in full_tasks:
            t_var = str(t.get("variant") or "1")
            if t_var not in (student_var, "all", "1,2"):
                continue
            filtered_tasks.append(t)

        # Если в проведении включено перемешивание вопросов
        if lrow["shuffle_questions"]:
            import random
            rnd_q = random.Random(f"{attempt['id']}_questions")
            rnd_q.shuffle(filtered_tasks)

        safe_tasks = []
        for idx, t in enumerate(filtered_tasks, 1):
            t_var = str(t.get("variant") or "1")
            t_type = t.get("question_type", "single_choice")
            raw_opts = list(t.get("options") or [])
            left_items = []
            right_items = []

            # Подготовка вариантов для ordering / matching / group_classification
            if t_type == "ordering":
                if not raw_opts and isinstance(t.get("answer_key"), list):
                    raw_opts = list(t.get("answer_key"))
                    import random
                    rnd = random.Random(f"{attempt['id']}_{t['id']}")
                    rnd.shuffle(raw_opts)
            elif t_type == "matching":
                ak = t.get("answer_key")
                if isinstance(ak, dict):
                    left_items = list(ak.keys())
                    right_items = list(dict.fromkeys(ak.values()))
                    import random
                    rnd = random.Random(f"{attempt['id']}_{t['id']}")
                    rnd.shuffle(right_items)
            elif t_type == "group_classification":
                ak = t.get("answer_key")
                if not raw_opts and isinstance(ak, dict):
                    raw_opts = list(ak.keys())
            elif t_type == "true_false":
                if not raw_opts:
                    raw_opts = ["Верно", "Неверно"]

            categories = list(t.get("categories") or [])
            if lrow["shuffle_options"]:
                import random
                rnd = random.Random(f"{attempt['id']}_{t['id']}_options")
                if t_type in ("single_choice", "multi_choice", "dropdown", "ordering", "true_false"):
                    rnd.shuffle(raw_opts)
                elif t_type == "group_classification":
                    rnd.shuffle(categories)

            st = StudentTaskView(
                id=t["id"],
                order_index=idx,
                question_text=t["question_text"],
                question_type=t_type,
                options=raw_opts,
                max_score=t.get("max_score", 1.0),
                descriptor=t.get("descriptor") or "",
                image_url=t.get("image_url"),
                image_size=t.get("image_size") or "100%",
                image_align=t.get("image_align") or "center",
                categories=categories,
                match_items_left=left_items,
                match_items_right=right_items,
                variant=t_var
            )
            safe_tasks.append(st.model_dump())


        # Загружаем ранее сохраненные ответы ученика (только по заданиям его варианта)
        valid_task_ids = {t["id"] for t in safe_tasks}
        cur_ans = await db.execute("SELECT task_id, answer_json, version, final_score FROM student_answers WHERE attempt_id = ?", (attempt["id"],))
        raw_ans = await cur_ans.fetchall()
        answers_map = {}
        completed_cnt = 0
        total_sc = 0.0
        for a in raw_ans:
            if valid_task_ids and a["task_id"] not in valid_task_ids:
                continue
            val = None
            if a["answer_json"]:
                try:
                    val = json.loads(a["answer_json"])
                except Exception:
                    val = a["answer_json"]
                if val is not None and str(val).strip() != "" and str(val) != "[]" and str(val) != "{}":
                    completed_cnt += 1
            if a["final_score"] is not None:
                total_sc += float(a["final_score"])
            answers_map[a["task_id"]] = {"answer": val, "version": a["version"]}

        time_spent_seconds = 0
        st_at = attempt.get("started_at")
        sub_at = attempt.get("submitted_at")
        if st_at:
            try:
                st_dt = datetime.fromisoformat(st_at)
                if st_dt.tzinfo is None:
                    st_dt = st_dt.replace(tzinfo=timezone.utc)
                end_dt = datetime.now(timezone.utc)
                if sub_at:
                    s_dt = datetime.fromisoformat(sub_at)
                    if s_dt.tzinfo is None:
                        s_dt = s_dt.replace(tzinfo=timezone.utc)
                    end_dt = s_dt
                time_spent_seconds = max(0, int((end_dt - st_dt).total_seconds()))
            except Exception:
                pass

        response_data["tasks"] = safe_tasks
        response_data["answers"] = answers_map
        response_data["total_tasks"] = len(safe_tasks)
        response_data["max_score"] = round(sum(float(t.get("max_score", 1.0)) for t in safe_tasks), 2)
        response_data["completed_count"] = completed_cnt
        response_data["total_score"] = round(total_sc, 2)
        response_data["time_spent_seconds"] = time_spent_seconds
        return response_data

@app.post("/api/student/start")
async def student_start_exam(attempt: dict = Depends(get_current_student_attempt)):
    """Переводит попытку из ожидания в in_progress и запускает серверный таймер"""
    if attempt["status"] not in ["approved", "in_waiting"]:
        if attempt["status"] == "in_progress":
            return {"ok": True, "status": "in_progress"}
        raise HTTPException(status_code=403, detail="Вы пока не можете начать работу. Дождитесь разрешения учителя.")

    if attempt["launch_status"] != "active":
        raise HTTPException(status_code=403, detail="Учитель ещё не активировал проведение работы")

    now = datetime.now(timezone.utc)
    duration = attempt.get("duration_minutes") or 0
    extra = attempt.get("extra_time_minutes") or 0
    total_minutes = duration + extra
    deadline_iso = (now + timedelta(minutes=total_minutes)).isoformat() if total_minutes > 0 else None

    async with get_db() as db:
        await db.execute("""
            UPDATE student_attempts
            SET status = 'in_progress', started_at = ?, server_deadline = ?
            WHERE id = ?
        """, (now.isoformat(), deadline_iso, attempt["id"]))
        await db.commit()

    broadcast_live_event(attempt["launch_id"], "student_started", {
        "attempt_id": attempt["id"],
        "status": "in_progress"
    })

    return {
        "ok": True,
        "status": "in_progress",
        "started_at": now.isoformat(),
        "server_deadline": deadline_iso
    }

@app.post("/api/student/save")
async def student_save_answer(req: SaveAnswerRequest, attempt: dict = Depends(get_current_student_attempt)):
    if attempt["status"] != "in_progress":
        raise HTTPException(status_code=403, detail="Сохранение невозможно: попытка не активна")

    if attempt_deadline_expired(attempt):
        raise HTTPException(status_code=403, detail="Время на выполнение работы истекло")

    now = datetime.now().isoformat()
    ans_json = json.dumps(req.answer, ensure_ascii=False)

    async with get_db() as db:
        await db.execute("BEGIN IMMEDIATE")
        current = await (await db.execute("SELECT status FROM student_attempts WHERE id = ?", (attempt["id"],))).fetchone()
        if not current or current["status"] != "in_progress":
            raise HTTPException(status_code=403, detail="Попытка уже завершена")
        c = await db.execute("SELECT id, version FROM student_answers WHERE attempt_id = ? AND task_id = ?", (attempt["id"], req.task_id))
        row = await c.fetchone()
        if row:
            if req.version < row["version"]:
                return {"ok": False, "conflict": True, "server_version": row["version"]}
            
            new_v = row["version"] + 1
            await db.execute("""
                UPDATE student_answers
                SET answer_json = ?, version = ?, updated_at = ?
                WHERE id = ?
            """, (ans_json, new_v, now, row["id"]))
        else:
            new_v = 1
            ans_id = str(uuid.uuid4())
            await db.execute("""
                INSERT INTO student_answers (id, attempt_id, task_id, answer_json, version, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (ans_id, attempt["id"], req.task_id, ans_json, new_v, now))

        await db.execute("UPDATE student_attempts SET last_saved_at = ? WHERE id = ?", (now, attempt["id"]))
        await db.commit()

    return {"ok": True, "version": new_v, "saved_at": now}

@app.post("/api/student/batch_save")
async def student_batch_save(req: BatchSaveAnswersRequest, attempt: dict = Depends(get_current_student_attempt)):
    """Пакетное сохранение для синхронизации локального черновика при восстановлении интернета"""
    if attempt["status"] != "in_progress":
        raise HTTPException(status_code=403, detail="Попытка не активна")
    if attempt_deadline_expired(attempt):
        raise HTTPException(status_code=403, detail="Время на выполнение работы истекло")

    now = datetime.now().isoformat()
    saved_versions = {}

    async with get_db() as db:
        await db.execute("BEGIN IMMEDIATE")
        current = await (await db.execute("SELECT status FROM student_attempts WHERE id = ?", (attempt["id"],))).fetchone()
        if not current or current["status"] != "in_progress":
            raise HTTPException(status_code=403, detail="Попытка уже завершена")
        for item in req.answers:
            ans_json = json.dumps(item.answer, ensure_ascii=False)
            c = await db.execute("SELECT id, version FROM student_answers WHERE attempt_id = ? AND task_id = ?", (attempt["id"], item.task_id))
            row = await c.fetchone()
            if row:
                if item.version >= row["version"]:
                    new_v = row["version"] + 1
                    await db.execute("UPDATE student_answers SET answer_json = ?, version = ?, updated_at = ? WHERE id = ?", (ans_json, new_v, now, row["id"]))
                    saved_versions[item.task_id] = new_v
                else:
                    saved_versions[item.task_id] = row["version"]
            else:
                ans_id = str(uuid.uuid4())
                await db.execute("INSERT INTO student_answers (id, attempt_id, task_id, answer_json, version, updated_at) VALUES (?, ?, ?, ?, 1, ?)", (ans_id, attempt["id"], item.task_id, ans_json, now))
                saved_versions[item.task_id] = 1

        await db.execute("UPDATE student_attempts SET last_saved_at = ? WHERE id = ?", (now, attempt["id"]))
        await db.commit()

    return {"ok": True, "saved_versions": saved_versions}

@app.post("/api/student/heartbeat")
async def student_heartbeat(attempt: dict = Depends(get_current_student_attempt)):
    now = datetime.now(timezone.utc).isoformat()
    async with get_db() as db:
        await db.execute("UPDATE student_attempts SET last_heartbeat = ? WHERE id = ?", (now, attempt["id"]))
        await db.commit()

    remaining_seconds = None
    if attempt.get("server_deadline"):
        try:
            dl = datetime.fromisoformat(attempt["server_deadline"])
            if dl.tzinfo is None:
                dl = dl.replace(tzinfo=timezone.utc)
            rem = (dl - datetime.now(timezone.utc)).total_seconds()
            remaining_seconds = max(0, int(rem))
        except Exception:
            pass

    return {
        "status": attempt["status"],
        "launch_status": attempt["launch_status"],
        "remaining_seconds": remaining_seconds
    }

@app.post("/api/student/submit")
async def student_submit(req: StudentSubmitRequest, attempt: dict = Depends(get_current_student_attempt)):
    """Атомарная сдача работы: фиксация ответов, автопроверка, расчет баллов и времени строго по варианту ученика"""
    now = datetime.now(timezone.utc).isoformat()

    async with get_db() as db:
        await db.execute("BEGIN IMMEDIATE")
        current = await (await db.execute("SELECT * FROM student_attempts WHERE id = ?", (attempt["id"],))).fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="Попытка не найдена")
        attempt.update(dict(current))
        if attempt["status"] == "in_progress" and attempt_deadline_expired(attempt):
            raise HTTPException(status_code=403, detail="Время на выполнение работы истекло")
        # Если уже сдана, возвращаем существующие подсчитанные результаты
        if attempt["status"] in ["submitted", "time_expired"]:
            conf_code = attempt.get("confirmation_code") or f"BAG-{secrets.token_hex(3).upper()}"
        else:
            if attempt["status"] != "in_progress":
                raise HTTPException(status_code=403, detail="Данная попытка не может быть сдана")

            # Если вместе с подтверждением пришли ответы (req.answers), атомарно сохраняем их в базу
            if req.answers and isinstance(req.answers, dict):
                for task_id, ans_val in req.answers.items():
                    if isinstance(ans_val, dict) and "answer" in ans_val:
                        raw_ans = ans_val["answer"]
                        ver = ans_val.get("version", 1)
                    else:
                        raw_ans = ans_val
                        ver = 1
                    ans_json = json.dumps(raw_ans, ensure_ascii=False)
                    c_ex = await db.execute("SELECT id, version FROM student_answers WHERE attempt_id = ? AND task_id = ?", (attempt["id"], str(task_id)))
                    row_ex = await c_ex.fetchone()
                    if row_ex:
                        await db.execute("""
                            UPDATE student_answers
                            SET answer_json = ?, version = version + 1, updated_at = ?
                            WHERE id = ?
                        """, (ans_json, now, row_ex["id"]))
                    else:
                        ans_id = str(uuid.uuid4())
                        await db.execute("""
                            INSERT INTO student_answers (id, attempt_id, task_id, answer_json, version, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?)
                        """, (ans_id, attempt["id"], str(task_id), ans_json, ver, now))

            conf_code = f"BAG-{datetime.now().strftime('%Y')}-{secrets.token_hex(3).upper()}"
            await db.execute("""
                UPDATE student_attempts
                SET status = 'submitted', submitted_at = ?, confirmation_code = ?
                WHERE id = ?
            """, (now, conf_code, attempt["id"]))

            # Автоматическая проверка объективных заданий
            c = await db.execute("SELECT snapshot_tasks_json FROM launches WHERE id = ?", (attempt["launch_id"],))
            lrow = await c.fetchone()
            if lrow:
                await auto_grade_attempt(db, attempt["id"], lrow["snapshot_tasks_json"])

            await db.commit()

        # Подсчет баллов, количества выполненных заданий и затраченного времени СТРОГО по варианту ученика
        c_launch = await db.execute("SELECT snapshot_tasks_json FROM launches WHERE id = ?", (attempt["launch_id"],))
        lrow = await c_launch.fetchone()
        all_tasks = json.loads(lrow["snapshot_tasks_json"]) if lrow else []
        stu_var = str(attempt.get("variant") or "1")
        tasks = [t for t in all_tasks if str(t.get("variant") or "1") in (stu_var, "all", "1,2")]
        if not tasks:
            tasks = all_tasks
        total_tasks = len(tasks)
        max_score = round(sum(float(t.get("max_score", 1.0)) for t in tasks), 2)
        valid_task_ids = {t["id"] for t in tasks}

        cur_sc = await db.execute("""
            SELECT task_id, answer_json, final_score
            FROM student_answers
            WHERE attempt_id = ?
        """, (attempt["id"],))
        ans_rows = await cur_sc.fetchall()
        completed_count = 0
        total_score = 0.0
        for a in ans_rows:
            if valid_task_ids and a["task_id"] not in valid_task_ids:
                continue
            aj = a["answer_json"]
            if aj is not None and aj != '""' and aj != 'null' and aj != '[]' and aj != '{}':
                completed_count += 1
            if a["final_score"] is not None:
                total_score += float(a["final_score"])
        total_score = round(total_score, 2)

        time_spent_seconds = 0
        st_at = attempt.get("started_at")
        if st_at:
            try:
                st_dt = datetime.fromisoformat(st_at)
                if st_dt.tzinfo is None:
                    st_dt = st_dt.replace(tzinfo=timezone.utc)
                time_spent_seconds = max(0, int((datetime.now(timezone.utc) - st_dt).total_seconds()))
            except Exception:
                pass

    broadcast_live_event(attempt["launch_id"], "student_submitted", {
        "attempt_id": attempt["id"],
        "student_name": attempt["student_name"],
        "student_class": attempt["student_class"],
        "status": "submitted",
        "confirmation_code": conf_code,
        "total_score": total_score
    })

    return {
        "ok": True,
        "status": "submitted",
        "submitted_at": attempt.get("submitted_at") or now,
        "confirmation_code": conf_code,
        "completed_count": completed_count,
        "total_tasks": total_tasks,
        "time_spent_seconds": time_spent_seconds,
        "total_score": total_score,
        "max_score": max_score
    }

# --- Синхронизация уроков в файлах сайта и генерация нативных страниц уроков ---
def map_grade_to_cid(grade_folder: str) -> str:
    gf = grade_folder.lower()
    if "11" in gf:
        return "c11"
    if "10" in gf and "емн" in gf:
        return "c10emn"
    if "10" in gf and "огн" in gf:
        return "c10ogn"
    if "9" in gf:
        return "c9"
    if "8" in gf:
        return "c8"
    return "c11"

def format_lesson_num_val(lesson_num: str):
    clean = lesson_num.lower().replace("урок", "").replace("номер", "").strip()
    if clean.isdigit():
        return int(clean)
    return f'"{lesson_num}"'

def bump_site_scripts_version(site_root: str):
    import re
    ver = str(int(datetime.now().timestamp()))
    index_path = os.path.join(site_root, "index.html")
    if os.path.exists(index_path):
        try:
            with open(index_path, "r", encoding="utf-8") as f:
                idx_content = f.read()
            new_idx = re.sub(r'скрипты/script\.js(?:\?v=[^"\']*)?', f'скрипты/script.js?v={ver}', idx_content)
            if new_idx != idx_content:
                with open(index_path, "w", encoding="utf-8") as f:
                    f.write(new_idx)
        except Exception as e:
            logger.error("Error bumping script.js version in index.html: %s", e)

def add_lesson_to_database_files(site_root: str, grade_folder: str, lesson_num: str, title: str, rel_path: str):
    import re
    remove_lesson_from_database_files(site_root, rel_path)
    cid = map_grade_to_cid(grade_folder)
    num_val = format_lesson_num_val(lesson_num)
    safe_title_json = json.dumps(title, ensure_ascii=False)

    script_path = os.path.join(site_root, "скрипты", "script.js")
    if os.path.exists(script_path):
        try:
            with open(script_path, "r", encoding="utf-8") as f:
                c1 = f.read()
            if rel_path not in c1:
                pattern = rf'({cid}\s*:\s*\{{[\s\S]*?lessons\s*:\s*\[[\s\S]*?)(\n\s*\])'
                match = re.search(pattern, c1)
                if match:
                    prefix = match.group(1).rstrip()
                    if not prefix.endswith(',') and not prefix.endswith('['):
                        prefix += ','
                    new_entry = f'      {{ num: {num_val}, title: {safe_title_json}, path: "{rel_path}" }}'
                    updated = c1[:match.start(1)] + prefix + "\n" + new_entry + match.group(2) + c1[match.end(2):]
                    with open(script_path, "w", encoding="utf-8") as f:
                        f.write(updated)
        except Exception as e:
            logger.error("Error updating script.js: %s", e)

    lessons_path = os.path.join(site_root, "скрипты", "lessons.js")
    if os.path.exists(lessons_path):
        try:
            with open(lessons_path, "r", encoding="utf-8") as f:
                c2 = f.read()
            if rel_path not in c2:
                pattern = rf'({cid}\s*:\s*\{{[\s\S]*?lessons\s*:\s*\[[\s\S]*?)(\n\s*\])'
                match = re.search(pattern, c2)
                if match:
                    prefix = match.group(1).rstrip()
                    if not prefix.endswith(',') and not prefix.endswith('['):
                        prefix += ','
                    new_entry = f'        {{ num: {num_val}, title: {safe_title_json}, file: "{rel_path}" }}'
                    updated = c2[:match.start(1)] + prefix + "\n" + new_entry + match.group(2) + c2[match.end(2):]
                    with open(lessons_path, "w", encoding="utf-8") as f:
                        f.write(updated)
        except Exception as e:
            logger.error("Error updating lessons.js: %s", e)

    bump_site_scripts_version(site_root)

def remove_lesson_from_database_files(site_root: str, rel_path: Optional[str] = None):
    import re
    changed_any = False
    for fn, prop in [("script.js", "path"), ("lessons.js", "file")]:
        target = os.path.join(site_root, "скрипты", fn)
        if not os.path.exists(target):
            continue
        try:
            with open(target, "r", encoding="utf-8") as f:
                content = f.read()
            lines = content.splitlines(keepends=True)
            new_lines = []
            prop_re = re.compile(rf'\b{prop}\s*:\s*"([^"]+)"')
            for l in lines:
                m = prop_re.search(l)
                if m:
                    entry_rel = m.group(1)
                    full_entry_path = os.path.join(site_root, entry_rel.replace("/", os.sep))
                    if (rel_path and entry_rel.lower() == rel_path.lower()) or not os.path.exists(full_entry_path):
                        changed_any = True
                        continue
                new_lines.append(l)
            updated = "".join(new_lines)
            # Clean up trailing comma right before closing bracket of lessons array
            updated = re.sub(r',(\s*\n\s*\])', r'\1', updated)
            if updated != content:
                with open(target, "w", encoding="utf-8") as f:
                    f.write(updated)
                changed_any = True
        except Exception as e:
            logger.error("Error removing lesson from %s: %s", fn, e)
    if changed_any:
        bump_site_scripts_version(site_root)

def cleanup_site_lessons_for_launches(site_root: str, launch_ids: list):
    if launch_ids:
        class_folders = ["8 класс", "9 класс", "10 ЕМН", "10 ОГН", "11 класс"]
        markers = [f"/exam/{lid}" for lid in launch_ids if lid]
        for cf in class_folders:
            cf_dir = os.path.join(site_root, cf)
            if not os.path.isdir(cf_dir):
                continue
            for root_dir, _, files in os.walk(cf_dir):
                for fn in files:
                    if not fn.lower().endswith(".html"):
                        continue
                    fpath = os.path.join(root_dir, fn)
                    try:
                        with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                            txt = f.read()
                        if any(m in txt for m in markers):
                            os.remove(fpath)
                    except Exception as e:
                        logger.error("Failed checking/removing lesson file %s: %s", fpath, e)
    remove_lesson_from_database_files(site_root)

def get_teacher_network_urls(request: Optional[Request] = None) -> List[str]:
    urls = []
    port = (request.url.port or (443 if request.url.scheme == "https" else 80)) if request else int(os.environ.get("BAGALAU_PORT", "8000"))
    env_url = os.environ.get("BAGALAU_PUBLIC_URL")
    if not env_url:
        try:
            with open(os.path.join(BASE_DIR, ".runtime", "public_url.txt"), encoding="utf-8-sig") as f:
                env_url = f.read().strip()
        except OSError:
            pass
    if env_url:
        urls.append(env_url.rstrip("/"))
    if request:
        req_base = str(request.base_url).rstrip("/")
        if "127.0.0.1" not in req_base and "localhost" not in req_base:
            urls.append(req_base)
    try:
        import socket
        hostname = socket.gethostname()
        lan_ips = []
        vpn_ips = []
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if not ip or ip.startswith("127.") or ip.startswith("169.254."):
                continue
            if ip.startswith("100."):
                vpn_ips.append(ip)
            else:
                lan_ips.append(ip)
        for ip in lan_ips + vpn_ips:
            u = f"http://{ip}:{port}"
            if u not in urls:
                urls.append(u)
    except Exception:
        pass
    local_url = f"http://127.0.0.1:{port}"
    if local_url not in urls:
        urls.append(local_url)
    return urls

def generate_native_lesson_html(
    grade: str,
    quarter: str,
    lesson_num: str,
    title: str,
    launch_id: str,
    tasks: list,
    exam_type: str = "СОР",
    instructions: str = "",
    exam_base_url: str = "http://127.0.0.1:8000",
    allowed_classes: Optional[list] = None,
    duration_minutes: int = 40,
    bg_color_v1: str = "#fce8e6",
    bg_color_v2: str = "#e6f4ea",
    server_urls: Optional[list] = None
) -> str:
    from html import escape
    from string import Template
    from urllib.parse import quote
    exam_url = exam_base_url.rstrip("/") + "/exam/" + quote(launch_id, safe="")
    lesson_id = f"{grade}-{lesson_num}".replace(" ", "-")
    config_payload = {
        "launch_id": launch_id,
        "grade": grade,
        "quarter": quarter,
        "lesson_num": lesson_num,
        "title": title,
        "exam_type": exam_type,
        "allowed_classes": allowed_classes or [grade],
        "duration_minutes": duration_minutes or 40,
        "bg_color_v1": bg_color_v1 or "#fce8e6",
        "bg_color_v2": bg_color_v2 or "#e6f4ea",
        "server_urls": server_urls or [exam_base_url.rstrip("/")],
        "tasks": tasks
    }
    exam_config_json = json.dumps(config_payload, ensure_ascii=False).replace("</", "<\\/")
    template = Template(open(os.path.join(BASE_DIR, "templates", "lesson.html"), encoding="utf-8").read())
    return template.safe_substitute(
        grade=escape(grade),
        quarter=escape(quarter),
        lesson_num=escape(lesson_num),
        lesson_id=escape(lesson_id, quote=True),
        title=escape(title),
        exam_type=escape(exam_type),
        instructions=escape(instructions or "Выберите свой класс, вариант и выполните задания проверочной работы."),
        exam_url=escape(exam_url, quote=True),
        exam_config_json=exam_config_json
    )

@app.post("/api/site/create_lesson")
async def create_site_lesson(req: CreateLessonPageRequest, request: Request, teacher: dict = Depends(get_current_teacher)):
    site_root = os.path.dirname(BASE_DIR)
    grade = req.grade_folder.strip()
    quarter = req.quarter_folder.strip()
    lesson_num = req.lesson_number.strip()
    title = req.lesson_title.strip() or f"{grade} · {quarter} · {lesson_num}"
    launch_id = req.launch_id.strip()

    async with get_db() as db:
        c = await db.execute("""
            SELECT l.*, t.exam_type, t.subject, t.instructions, t.grade_level
            FROM launches l
            JOIN tests t ON l.test_id = t.id
            WHERE l.id = ? AND l.teacher_id = ?
        """, (launch_id, teacher["id"]))
        launch_row = await c.fetchone()
        if not launch_row:
            raise HTTPException(status_code=404, detail="Сессия проведения не найдена")

        l_dict = dict(launch_row)
        tasks = json.loads(l_dict["snapshot_tasks_json"])
        exam_type = l_dict.get("exam_type") or "СОР"
        instructions = l_dict.get("instructions") or ""
        allowed_classes = json.loads(l_dict.get("allowed_classes_json") or "[]")
        duration_minutes = int(l_dict.get("duration_minutes") or 40)
        bg_color_v1 = l_dict.get("bg_color_v1") or "#fce8e6"
        bg_color_v2 = l_dict.get("bg_color_v2") or "#e6f4ea"

    target_dir = os.path.join(site_root, grade, quarter)
    os.makedirs(target_dir, exist_ok=True)

    file_name = f"{lesson_num}.html" if not lesson_num.endswith(".html") else lesson_num
    target_path = os.path.join(target_dir, file_name)
    srv_urls = get_teacher_network_urls(request)

    html_content = generate_native_lesson_html(
        grade=grade,
        quarter=quarter,
        lesson_num=lesson_num,
        title=title,
        launch_id=launch_id,
        tasks=tasks,
        exam_type=exam_type,
        instructions=instructions,
        exam_base_url=srv_urls[0] if srv_urls else str(request.base_url).rstrip("/"),
        allowed_classes=allowed_classes,
        duration_minutes=duration_minutes,
        bg_color_v1=bg_color_v1,
        bg_color_v2=bg_color_v2,
        server_urls=srv_urls
    )

    with open(target_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    rel_path = f"{grade}/{quarter}/{file_name}".replace("\\", "/")

    # Синхронизируем добавление в script.js и lessons.js
    add_lesson_to_database_files(
        site_root=site_root,
        grade_folder=grade,
        lesson_num=lesson_num,
        title=title,
        rel_path=rel_path
    )

    return {
        "ok": True,
        "file_name": file_name,
        "relative_path": rel_path,
        "absolute_path": target_path,
        "message": f"Страница урока успешно создана и добавлена в меню сайта: {rel_path}"
    }

@app.post("/api/site/delete_lesson")
async def delete_site_lesson(req: DeleteLessonPageRequest, teacher: dict = Depends(get_current_teacher)):
    site_root = os.path.dirname(BASE_DIR)
    rel_path = req.relative_path

    if not rel_path and req.grade_folder and req.quarter_folder and req.lesson_number:
        file_name = f"{req.lesson_number}.html" if not req.lesson_number.endswith(".html") else req.lesson_number
        rel_path = f"{req.grade_folder}/{req.quarter_folder}/{file_name}".replace("\\", "/")

    if not rel_path:
        raise HTTPException(status_code=400, detail="Укажите relative_path или папку и номер урока")

    target_path = os.path.join(site_root, rel_path.replace("/", os.sep))

    deleted_file = False
    if os.path.exists(target_path):
        try:
            os.remove(target_path)
            deleted_file = True
        except Exception as e:
            logger.error("Failed to delete file %s: %s", target_path, e)

    remove_lesson_from_database_files(site_root, rel_path)

    return {
        "ok": True,
        "deleted_file": deleted_file,
        "relative_path": rel_path,
        "message": f"Страница {rel_path} удалена с сайта и из меню уроков."
    }


@app.get("/api/student/results")
async def student_get_results(attempt: dict = Depends(get_current_student_attempt)):
    """
    Просмотр результатов учеником:
    Показывает баллы, ключи или комментарии ТОЛЬКО если учитель разрешил их публикацию!
    """
    if attempt["status"] not in ["submitted", "time_expired"]:
        raise HTTPException(status_code=403, detail="Результаты доступны только после сдачи работы")

    pub_scores = bool(attempt.get("publish_scores", 0))
    pub_answers = bool(attempt.get("publish_answers", 0))
    pub_comments = bool(attempt.get("publish_comments", 0))

    if not pub_scores and not pub_answers and not pub_comments:
        return {
            "published": False,
            "message": "Учитель ещё не опубликовал результаты данной работы. Ожидайте публикации.",
            "confirmation_code": attempt.get("confirmation_code"),
            "submitted_at": attempt.get("submitted_at")
        }

    async with get_db() as db:
        c = await db.execute("SELECT snapshot_tasks_json FROM launches WHERE id = ?", (attempt["launch_id"],))
        lrow = await c.fetchone()
        all_tasks = json.loads(lrow["snapshot_tasks_json"]) if lrow else []
        stu_var = str(attempt.get("variant") or "1")
        tasks = [t for t in all_tasks if str(t.get("variant") or "1") in (stu_var, "all", "1,2")]
        if not tasks:
            tasks = all_tasks

        cur_ans = await db.execute("SELECT * FROM student_answers WHERE attempt_id = ?", (attempt["id"],))
        raw_ans = await cur_ans.fetchall()
        answers_map = {a["task_id"]: dict(a) for a in raw_ans}

    total_score = 0.0
    max_total = round(sum(float(t.get("max_score", 1.0)) for t in tasks), 2)
    tasks_result = []

    for idx, t in enumerate(tasks, 1):
        t_id = t["id"]
        ans = answers_map.get(t_id, {})
        student_val = None
        if ans.get("answer_json"):
            try:
                student_val = json.loads(ans["answer_json"])
            except Exception:
                student_val = ans["answer_json"]

        item = {
            "order_index": idx,
            "question_text": t["question_text"],
            "question_type": t["question_type"],
            "max_score": float(t.get("max_score", 1.0)),
            "student_answer": student_val,
        }

        if pub_scores:
            sc = ans.get("final_score")
            item["score"] = sc
            item["is_graded"] = bool(ans.get("is_graded", 0))
            if sc is not None:
                total_score += float(sc)

        if pub_answers:
            item["correct_answer"] = t.get("answer_key")
            item["explanation"] = t.get("comment_explanation")

        if pub_comments:
            item["teacher_comment"] = ans.get("teacher_comment")

        tasks_result.append(item)

    percent = round((total_score / max_total * 100), 1) if max_total > 0 else 0

    return {
        "published": True,
        "publish_scores": pub_scores,
        "publish_answers": pub_answers,
        "publish_comments": pub_comments,
        "total_score": total_score if pub_scores else None,
        "max_total": max_total,
        "percent": percent if pub_scores else None,
        "confirmation_code": attempt.get("confirmation_code"),
        "submitted_at": attempt.get("submitted_at"),
        "tasks": tasks_result
    }

if __name__ == "__main__":
    import uvicorn
    from contextlib import nullcontext
    from public_gateway import StudentPublicGateway

    class TunnelServer(uvicorn.Server):
        def capture_signals(self):
            return nullcontext()

        def install_signal_handlers(self):
            pass

    port = int(os.environ.get("BAGALAU_PORT", "8000"))
    student_port = int(os.environ.get("BAGALAU_STUDENT_PORT", "8001"))
    print("Адреса сервера «Бағалау»:")
    for url in get_teacher_network_urls():
        print(f"  {url}/teacher")

    async def serve_servers():
        teacher_server = uvicorn.Server(uvicorn.Config(app, host="0.0.0.0", port=port))
        student_server = TunnelServer(uvicorn.Config(
            StudentPublicGateway(app), host="127.0.0.1", port=student_port, lifespan="off"))
        tunnel_task = asyncio.create_task(student_server.serve())
        try:
            await teacher_server.serve()
        finally:
            student_server.should_exit = True
            await tunnel_task

    asyncio.run(serve_servers())
