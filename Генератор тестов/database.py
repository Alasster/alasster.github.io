import os
import aiosqlite
import json
import logging
from datetime import datetime, timezone

DB_DIR = os.environ.get("BAGALAU_DB_DIR", os.path.join(os.path.dirname(__file__), "data"))
DB_PATH = os.path.join(DB_DIR, "bagalau.sqlite3")

from contextlib import asynccontextmanager

logger = logging.getLogger("bagalau.db")

@asynccontextmanager
async def get_db():
    os.makedirs(DB_DIR, exist_ok=True)
    db = await aiosqlite.connect(DB_PATH, timeout=30)
    db.row_factory = aiosqlite.Row
    try:
        await db.execute("PRAGMA busy_timeout = 30000;")
        await db.execute("PRAGMA journal_mode = WAL;")
        await db.execute("PRAGMA synchronous = NORMAL;")
        await db.execute("PRAGMA foreign_keys = ON;")
        yield db
    finally:
        await db.close()

async def init_db():
    os.makedirs(DB_DIR, exist_ok=True)
    async with get_db() as db:
        # Teachers
        await db.execute("""
        CREATE TABLE IF NOT EXISTS teachers (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """)

        # Tests (Шаблоны работ СОР / СОЧ)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS tests (
            id TEXT PRIMARY KEY,
            teacher_id TEXT NOT NULL,
            title TEXT NOT NULL,
            exam_type TEXT NOT NULL, -- 'СОР' или 'СОЧ'
            subject TEXT NOT NULL,
            grade_level TEXT NOT NULL, -- '9', '10 ЕМН', '10 ОГН', '11' и т.д.
            class_letters_json TEXT, -- JSON список букв: ['А', 'Б']
            variant TEXT DEFAULT '1', -- '1', '2' и т.д.
            quarter INTEGER NOT NULL, -- 1, 2, 3, 4
            section TEXT, -- Раздел / сквозная тема
            instructions TEXT,
            learning_objectives TEXT,
            assessment_criteria TEXT,
            bg_color TEXT DEFAULT '#f8fafc',
            bg_color_v1 TEXT DEFAULT '#fce8e6',
            bg_color_v2 TEXT DEFAULT '#e6f4ea',
            has_variants INTEGER DEFAULT 1,
            duration_minutes INTEGER DEFAULT 45,
            is_archived INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
        );
        """)

        # Tasks (Задания в шаблоне)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            test_id TEXT NOT NULL,
            order_index INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            question_type TEXT NOT NULL,
            options_json TEXT,
            max_score REAL NOT NULL DEFAULT 1.0,
            descriptor TEXT,
            check_method TEXT DEFAULT 'exact',
            tolerance REAL DEFAULT 0.0,
            answer_key_json TEXT,
            comment_explanation TEXT,
            image_url TEXT,
            image_size TEXT DEFAULT '100%',
            image_align TEXT DEFAULT 'center',
            categories_json TEXT,
            variant TEXT DEFAULT '1', -- '1', '2' или 'all'
            created_at TEXT NOT NULL,
            FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
        );
        """)

        # Launches (Конкретные проведения / сессии)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS launches (
            id TEXT PRIMARY KEY,
            test_id TEXT NOT NULL,
            teacher_id TEXT NOT NULL,
            title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            allowed_classes_json TEXT NOT NULL,
            manual_approval INTEGER DEFAULT 0,
            duration_minutes INTEGER DEFAULT 45,
            scheduled_start TEXT,
            scheduled_end TEXT,
            timezone TEXT DEFAULT 'Asia/Qyzylorda',
            shuffle_questions INTEGER DEFAULT 0,
            shuffle_options INTEGER DEFAULT 0,
            allow_back_nav INTEGER DEFAULT 1,
            show_all_at_once INTEGER DEFAULT 1,
            publish_scores INTEGER DEFAULT 0,
            publish_answers INTEGER DEFAULT 0,
            publish_comments INTEGER DEFAULT 0,
            bg_color TEXT DEFAULT '#f8fafc',
            bg_color_v1 TEXT DEFAULT '#fce8e6',
            bg_color_v2 TEXT DEFAULT '#e6f4ea',
            is_archived INTEGER DEFAULT 0,
            snapshot_tasks_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            started_at TEXT,
            finished_at TEXT,
            FOREIGN KEY (test_id) REFERENCES tests(id),
            FOREIGN KEY (teacher_id) REFERENCES teachers(id)
        );
        """)

        # Student Attempts (Сессии участников)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS student_attempts (
            id TEXT PRIMARY KEY,
            launch_id TEXT NOT NULL,
            student_name TEXT NOT NULL,
            student_class TEXT NOT NULL,
            variant TEXT DEFAULT '1',
            attempt_token TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL DEFAULT 'in_waiting',
            started_at TEXT,
            submitted_at TEXT,
            server_deadline TEXT,
            extra_time_minutes INTEGER DEFAULT 0,
            allow_extra_attempt INTEGER DEFAULT 0,
            ip_address TEXT,
            user_agent TEXT,
            is_duplicate_flag INTEGER DEFAULT 0,
            device_name TEXT,
            last_heartbeat TEXT,
            last_saved_at TEXT,
            confirmation_code TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (launch_id) REFERENCES launches(id) ON DELETE CASCADE
        );
        """)

        # Student Answers (Ответы ученика)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS student_answers (
            id TEXT PRIMARY KEY,
            attempt_id TEXT NOT NULL,
            task_id TEXT NOT NULL,
            answer_json TEXT,
            version INTEGER DEFAULT 1,
            auto_score REAL,
            manual_score REAL,
            final_score REAL,
            teacher_comment TEXT,
            is_graded INTEGER DEFAULT 0,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (attempt_id) REFERENCES student_attempts(id) ON DELETE CASCADE,
            UNIQUE(attempt_id, task_id)
        );
        """)

        # Audit Logs
        await db.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            launch_id TEXT,
            action TEXT NOT NULL,
            details_json TEXT,
            created_at TEXT NOT NULL
        );
        """)

        # Classes / Roster
        await db.execute("""
        CREATE TABLE IF NOT EXISTS class_rosters (
            id TEXT PRIMARY KEY,
            teacher_id TEXT NOT NULL,
            class_name TEXT NOT NULL,
            student_name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
        );
        """)

        # Safe schema migrations for existing SQLite databases
        migrations = [
            ("tests", "class_letters_json", "TEXT"),
            ("tests", "variant", "TEXT DEFAULT '1'"),
            ("tests", "bg_color", "TEXT DEFAULT '#f8fafc'"),
            ("tests", "bg_color_v1", "TEXT DEFAULT '#fce8e6'"),
            ("tests", "bg_color_v2", "TEXT DEFAULT '#e6f4ea'"),
            ("tests", "has_variants", "INTEGER DEFAULT 1"),
            ("tests", "shuffle_options", "INTEGER DEFAULT 0"),
            ("tests", "duration_minutes", "INTEGER DEFAULT 45"),
            ("tasks", "image_size", "TEXT DEFAULT '100%'"),
            ("tasks", "image_align", "TEXT DEFAULT 'center'"),
            ("tasks", "categories_json", "TEXT"),
            ("tasks", "variant", "TEXT DEFAULT '1'"),
            ("launches", "bg_color", "TEXT DEFAULT '#f8fafc'"),
            ("launches", "bg_color_v1", "TEXT DEFAULT '#fce8e6'"),
            ("launches", "bg_color_v2", "TEXT DEFAULT '#e6f4ea'"),
            ("launches", "is_archived", "INTEGER DEFAULT 0"),
            ("student_attempts", "device_name", "TEXT"),
            ("student_attempts", "variant", "TEXT DEFAULT '1'")
        ]
        for tbl, col, col_def in migrations:
            try:
                await db.execute(f"ALTER TABLE {tbl} ADD COLUMN {col} {col_def};")
            except Exception:
                pass

        # Indexes
        await db.execute("CREATE INDEX IF NOT EXISTS idx_tasks_test_id ON tasks(test_id);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_launches_teacher_id ON launches(teacher_id);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_launches_status ON launches(status);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_attempts_launch_id ON student_attempts(launch_id);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_attempts_token ON student_attempts(attempt_token);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_answers_attempt_id ON student_answers(attempt_id);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_rosters_teacher_class ON class_rosters(teacher_id, class_name);")

        # Initial teacher account
        cursor = await db.execute("SELECT COUNT(*) as cnt FROM teachers")
        row = await cursor.fetchone()
        if row["cnt"] == 0:
            import uuid
            from auth import hash_password
            default_id = str(uuid.uuid4())
            pass_hash = hash_password("bagalau2026")
            await db.execute("""
                INSERT INTO teachers (id, username, password_hash, full_name, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (default_id, "teacher", pass_hash, "Кадыржанов Жанас Кайыржанович", datetime.now().isoformat()))

        await db.commit()
    logger.info("Database initialized successfully at %s", DB_PATH)
