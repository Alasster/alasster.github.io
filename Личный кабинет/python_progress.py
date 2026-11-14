"""Small, user-scoped Python drafts; works with SQLite and the Turso adapter."""
from contextlib import closing
from datetime import datetime, timezone

from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


def init_progress_schema(db):
    db.execute("""CREATE TABLE IF NOT EXISTS python_task_progress (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER NOT NULL,
        task_id TEXT NOT NULL,
        code TEXT NOT NULL DEFAULT '',
        done INTEGER NOT NULL DEFAULT 0,
        version INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, lesson_id, task_id)
    )""")


class ProgressUpdate(BaseModel):
    user_id: int = Field(gt=0)
    version: int = Field(ge=0)
    code: str | None = Field(default=None, max_length=32768)
    done: bool | None = None


def install_progress_routes(app, open_db, get_user):
    def valid_key(lesson_id, task_id=None):
        import re
        if not 1 <= lesson_id <= 17:
            return False
        if task_id is None:
            return True
        maximum = {1: 11, 3: 13, 17: 100}.get(lesson_id, 10)
        return bool(re.fullmatch(r"task-[0-9]{3}", task_id)) and 1 <= int(task_id[5:]) <= maximum

    @app.get('/api/python-progress/{lesson_id}')
    def read_progress(lesson_id: int, request: Request):
        user = get_user(request)
        if user is None:
            return JSONResponse({'detail': 'Требуется авторизация'}, status_code=401)
        if not valid_key(lesson_id):
            return JSONResponse({'detail': 'Урок не найден'}, status_code=404)
        with closing(open_db()) as db:
            rows = db.execute(
                'SELECT task_id, code, done, version, updated_at FROM python_task_progress WHERE user_id = ? AND lesson_id = ?',
                (user['id'], lesson_id),
            ).fetchall()
        return {'user_id': user['id'], 'tasks': [dict(row) for row in rows]}

    @app.patch('/api/python-progress/{lesson_id}/{task_id}')
    def save_progress(lesson_id: int, task_id: str, payload: ProgressUpdate, request: Request):
        user = get_user(request)
        if user is None:
            return JSONResponse({'detail': 'Требуется авторизация'}, status_code=401)
        if not valid_key(lesson_id, task_id):
            return JSONResponse({'detail': 'Задание не найдено'}, status_code=404)
        if payload.user_id != user['id']:
            return JSONResponse({'detail': 'Аккаунт изменился. Обнови страницу.'}, status_code=403)
        if payload.code is not None and len(payload.code.encode('utf-8')) > 32768:
            return JSONResponse({'detail': 'Код должен занимать не больше 32 КБ'}, status_code=413)
        if payload.code is None and payload.done is None:
            return JSONResponse({'detail': 'Нет изменений'}, status_code=400)
        key = (user['id'], lesson_id, task_id)
        with closing(open_db()) as db:
            current = db.execute('SELECT * FROM python_task_progress WHERE user_id=? AND lesson_id=? AND task_id=?', key).fetchone()
            if current is not None and current['version'] != payload.version:
                return JSONResponse({'detail': 'Решение изменено на другом устройстве', 'current': dict(current)}, status_code=409)
            code = payload.code if payload.code is not None else (current['code'] if current else '')
            done = int(payload.done) if payload.done is not None else (current['done'] if current else 0)
            if current is not None and code == current['code'] and done == current['done']:
                return {'user_id': user['id'], 'task': dict(current)}
            now = datetime.now(timezone.utc).isoformat()
            if current is None and payload.version == 0:
                row = db.execute('''INSERT INTO python_task_progress
                    (user_id, lesson_id, task_id, code, done, version, updated_at)
                    VALUES (?, ?, ?, ?, ?, 1, ?) ON CONFLICT DO NOTHING RETURNING *''', (*key, code, done, now)).fetchone()
            else:
                row = db.execute('''UPDATE python_task_progress SET code=?, done=?, version=version+1, updated_at=?
                    WHERE user_id=? AND lesson_id=? AND task_id=? AND version=? RETURNING *''',
                    (code, done, now, *key, payload.version)).fetchone()
            if row is None:
                db.rollback()
                latest = db.execute('SELECT * FROM python_task_progress WHERE user_id=? AND lesson_id=? AND task_id=?', key).fetchone()
                return JSONResponse({'detail': 'Решение изменено на другом устройстве', 'current': dict(latest) if latest else None}, status_code=409)
            db.commit()
        return {'user_id': user['id'], 'task': dict(row)}
