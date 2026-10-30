"""Isolated, durable KSP generation service powered by Google Gemini API.
Includes deep pedagogical prompt, strict 45-minute timing, and zero OOP/ZPR.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from html import unescape
from pathlib import Path
from urllib.parse import unquote

import httpx
from fastapi import HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from ksp_document import build_docx

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent

GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite']

GEMINI_PLAN_SCHEMA = {
    'type': 'OBJECT',
    'properties': {
        'header': {
            'type': 'OBJECT',
            'properties': {
                'school': {'type': 'STRING'},
                'section': {'type': 'STRING'},
                'teacher': {'type': 'STRING'},
                'subject': {'type': 'STRING'},
                'date': {'type': 'STRING'},
                'grade': {'type': 'STRING'},
                'theme': {'type': 'STRING'},
                'curriculum_goal': {'type': 'STRING'},
                'lesson_goals': {'type': 'STRING'},
                'values': {'type': 'STRING'},
                'functional_literacy': {'type': 'STRING'},
                'ai_tools': {'type': 'STRING'}
            },
            'required': [
                'school', 'section', 'teacher', 'subject', 'date',
                'grade', 'theme', 'curriculum_goal', 'lesson_goals',
                'values', 'functional_literacy', 'ai_tools'
            ]
        },
        'stages': {
            'type': 'ARRAY',
            'items': {
                'type': 'OBJECT',
                'properties': {
                    'stage_name': {'type': 'STRING'},
                    'teacher_actions': {'type': 'STRING'},
                    'student_actions': {'type': 'STRING'},
                    'assessment': {'type': 'STRING'},
                    'resources': {'type': 'STRING'}
                },
                'required': [
                    'stage_name', 'teacher_actions', 'student_actions',
                    'assessment', 'resources'
                ]
            }
        }
    },
    'required': ['header', 'stages']
}


def plain(html: str) -> str:
    html = re.sub(r'<(script|style|svg)\b[^>]*>.*?</\1>', '', html, flags=re.S | re.I)
    html = re.sub(r'<(?:br|/p|/div|/section|/h[1-6]|/li)\b[^>]*>', '\n', html, flags=re.I)
    return unescape(re.sub(r'<[^>]+>', ' ', html)).strip()


def lesson_source(key: str) -> dict:
    """Extract authoritative lesson metadata from project and confirmed timetable."""
    key = unquote(key).lstrip('/')
    path = (ROOT / key).resolve()
    if not path.is_relative_to(ROOT.resolve()) or path.suffix != '.html':
        raise ValueError('Недопустимый путь урока')
    parts = path.relative_to(ROOT).parts
    if len(parts) != 3 or parts[0] == 'Python основы':
        raise ValueError('КСП доступен для школьных уроков (кроме Python основы)')
    if not path.is_file():
        raise ValueError('Файл урока не найден')

    html = path.read_text(encoding='utf-8-sig')
    heading = re.search(r'<h1\b[^>]*>(.*?)</h1>', html, re.S | re.I)
    title = re.sub(r'\s+', ' ', plain(heading.group(1))) if heading else path.stem

    # Extract goal from lesson HTML definition
    definitions = re.findall(r'<div\b[^>]*class=["\'][^"\']*\bdefinition\b[^"\']*["\'][^>]*>(.*?)</div>', html, re.S | re.I)
    html_goals = []
    for definition in definitions:
        for goal in re.split(r';\s*(?=\d+\.\d+\.\d+\.\d+)', plain(definition)):
            if re.match(r'^\s*\d+\.\d+\.\d+\.\d+\s*[—–-]', goal):
                cleaned = re.sub(r'\s+', ' ', goal).strip()
                if cleaned not in html_goals:
                    html_goals.append(cleaned)

    # Lookup timetable from KTP
    timetable_file = BASE / 'ksp-timetable.json'
    schedule = json.loads(timetable_file.read_text(encoding='utf-8')) if timetable_file.is_file() else {}
    slot = schedule.get(key, {})

    goals = slot.get('goals') or html_goals
    if not goals and html_goals:
        goals = html_goals
    if not goals:
        # Fallback to general topic goal if not in definition
        goals = [f"{parts[0]}: освоение темы «{title}»"]

    dates = re.findall(r'(?<!\d)(?:\d{2}\.\d{2}\.20\d{2}|20\d{2}-\d{2}-\d{2})(?!\d)', plain(html))
    date_val = slot.get('date') or (dates[0] if dates else '07.09.2026')
    section_val = slot.get('section') or 'Информатика'
    theme_val = slot.get('theme') or title
    num = re.search(r'\d+', path.stem).group() if re.search(r'\d+', path.stem) else '1'

    return dict(
        key=key,
        class_name=parts[0],
        quarter=parts[1],
        number=num,
        title=theme_val,
        goals=goals,
        date=date_val,
        section=section_val,
        duration=45,
        language='ru',
        content=plain(html)[:20000],
        source_hash=hashlib.sha256(html.encode()).hexdigest()
    )


def safe_name(value: str) -> str:
    return re.sub(r'[<>:"/\\|?*\x00-\x1f]', ' ', value).strip(' .')[:145]


def output_path(source: dict, output_root: Path) -> Path:
    return (
        output_root / '2026–2027' / source['class_name'] / source['quarter'] /
        f"Урок {int(source['number']):02d} КСП — {safe_name(source['title'])}.docx"
    )


def validate_plan(plan: dict, source: dict):
    header = plan.get('header', {})
    stages = plan.get('stages', [])

    if len(stages) < 5:
        raise ValueError('План должен содержать ровно пять этапов общей длительностью 45 минут')

    full_text = json.dumps(plan, ensure_ascii=False)
    if re.search(r'\bООП\b|\bЗПР\b|особым[и]? образовательн', full_text, re.I):
        raise ValueError('План содержит исключённые блоки ООП')

    required_meta = ['section', 'lesson_goals', 'values', 'functional_literacy', 'ai_tools']
    for k in required_meta:
        if not str(header.get(k, '')).strip():
            raise ValueError(f'Не заполнено обязательное поле шапки КСП: {k}')


def generate(source: dict) -> dict:
    """Generate structured lesson plan using Google Gemini API."""
    api_key = os.environ.get('GEMINI_API_KEY', '').strip()
    if not api_key:
        raise ValueError('Не указан ключ GEMINI_API_KEY. Добавьте его в файл .env в папке Личный кабинет.')

    teacher_name = os.environ.get('KSP_TEACHER', 'Кадыржанов Ж.К.')
    school_name = 'ГПХ на ПХВ «Школа - гимназия №22»'

    system_instructions = f"""Ты — выдающийся методист по информатике в Республике Казахстан.
Твоя задача — составить максимально подробный, глубокий и высокопрофессиональный краткосрочный план урока (КСП) в формате JSON строго по структуре.

СТРОЖАЙШИЕ ПРАВИЛА:
1. КАТЕГОРИЧЕСКИ БЕЗ ООП (в классе нет детей с ООП или ЗПР, любые слова ООП, ЗПР, адаптации исключить полностью).
2. Общее время урока: ровно 45 минут, ровно 5 этапов:
   - 1. ОРГ. МОМЕНТ (5 мин)
   - 2. АКТУАЛИЗАЦИЯ ЗНАНИЙ (5 мин)
   - 3. ОБЪЯСНЕНИЕ НОВОГО МАТЕРИАЛА (10 мин)
   - 4. ПРАКТИЧЕСКАЯ РАБОТА (20 мин)
   - 5. ПОДВЕДЕНИЕ ИТОГОВ УРОКА (5 мин)
3. Обязательно связать с платформой www.alasster.site ({source['class_name']}, {source['quarter']}, {source['number']} урок).
4. ТРЕБОВАНИЯ К ДЕЯТЕЛЬНОСТИ УЧИТЕЛЯ (teacher_actions):
   - Орг. момент (5 мин): Приветствие («Здравствуйте, ребята!»), создание коллаборативной среды, психологический настрой, объявление темы, целей урока и критериев успеха понятным языком.
   - Актуализация знаний (5 мин): Интерактивная разминка или фронтальный опрос. Обязательно написать прямую речь учителя с конкретными вопросами и ожидаемыми ответами учащихся. Логическая подводка к новой теме.
   - Объяснение нового материала (10 мин): Глубокое, подробное объяснение ключевых понятий и алгоритмов темы (НЕ общие фразы!). Прямая речь учителя: термины, наглядные примеры из жизни, демонстрация слайдов и демонстрационных материалов с сайта www.alasster.site, промежуточные контрольные вопросы для проверки понимания.
   - Практическая работа (20 мин): Инструктаж по технике безопасности и работе за ПК. Постановка задачи. ОБЯЗАТЕЛЬНО минимум 3 конкретных практических задания:
     * Задание 1 (базовый уровень): условие, пошаговая инструкция, правильный ответ, дескриптор.
     * Задание 2 (применение): условие задачи/кейса, решение, дескриптор.
     * Задание 3 (высокий уровень / продвинутое): проблемная задача на анализ, решение, дескриптор.
     Для учителя обязательно расписать ключи ответов и чёткие дескрипторы оценивания.
   - Подведение итогов (5 мин): Развёрнутая рефлексия («Конструктор урока», анкета или карточки). Разбор типичных ошибок. Выставление и комментирование баллов ФО. Чёткий инструктаж по домашнему заданию.
5. ТРЕБОВАНИЯ К ДЕЯТЕЛЬНОСТИ ОБУЧАЮЩИХСЯ (student_actions):
   - Реальные действия школьников: работа на ПК, конспектирование в тетрадях, выполнение заданий на www.alasster.site, ответы на вопросы, взаимопроверка.
6. ОЦЕНИВАНИЕ (assessment):
   - Словесная похвала учителя, критериальное и формативное оценивание (10-балльная шкала с баллами за каждое задание).
7. ФУНКЦИОНАЛЬНАЯ ГРАМОТНОСТЬ (functional_literacy):
   - Практический кейс по стандартам ICILS/PISA (применение цифровых навыков в реальной жизни).
8. ИСКУССТВЕННЫЙ ИНТЕЛЛЕКТ (ai_tools):
   - Chat gpt, google ai studio, claude, copilot, gemini — конкретные сценарии применения учителем при подготовке и учениками для проверки.

ДАННЫЕ УРОКА:
- Школа: {school_name}
- ФИО учителя: {teacher_name}
- Предмет: Информатика
- Класс: {source['class_name']}
- Раздел: {source['section']}
- Дата: {source['date']}
- Тема урока: {source['title']}. Урок {source['number']}
- Цели обучения: {' '.join(source['goals'])}
- Материалы урока сайта:
{source['content'][:4000]}
"""

    payload = {
        'contents': [{'parts': [{'text': system_instructions}]}],
        'generationConfig': {
            'responseMimeType': 'application/json',
            'responseSchema': GEMINI_PLAN_SCHEMA,
            'temperature': 0.25
        }
    }

    last_error = None
    for model in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        try:
            with httpx.Client(timeout=httpx.Timeout(90.0, connect=15.0)) as client:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    text_content = resp.json()['candidates'][0]['content']['parts'][0]['text']
                    plan = json.loads(text_content)
                    validate_plan(plan, source)
                    return plan
                elif resp.status_code == 403:
                    resp_json = resp.json() if resp.headers.get('content-type', '').startswith('application/json') else {}
                    err_msg = resp_json.get('error', {}).get('message', '')
                    if 'leaked' in err_msg.lower():
                        raise ValueError('Ключ Gemini API заблокирован Google (обнаружен в публичном доступе). Пожалуйста, создайте новый бесплатный ключ на https://aistudio.google.com/app/apikey и добавьте в .env')
                    last_error = f"Gemini 403: {err_msg or resp.text[:200]}"
                else:
                    last_error = f"Gemini {model} вернул статус {resp.status_code}: {resp.text[:250]}"
        except ValueError:
            raise
        except Exception as exc:
            last_error = f"Gemini {model} ошибка подключения: {str(exc)}"

    raise ValueError(f"Не удалось сгенерировать КСП: {last_error}")


class KspService:
    def __init__(self, state_dir=None, output_root=None, generator=None):
        self.state = Path(state_dir or BASE / '.runtime' / 'ksp')
        self.state.mkdir(parents=True, exist_ok=True)
        self.db_path = self.state / 'jobs.sqlite3'

        configured_output = os.environ.get('KSP_OUTPUT_ROOT')
        if configured_output:
            self.output_root = Path(configured_output)
        else:
            self.output_root = Path(ROOT.parent / 'КСП')

        self.template = Path(os.environ.get('KSP_TEMPLATE_PATH', BASE / 'ksp_template.docx'))
        self.generator = generator or generate
        self.pool = ThreadPoolExecutor(max_workers=2, thread_name_prefix='ksp')
        self.lock = threading.Lock()

        with self.db() as db:
            db.execute('''
                CREATE TABLE IF NOT EXISTS jobs (
                    key TEXT PRIMARY KEY,
                    id TEXT,
                    status TEXT,
                    message TEXT,
                    path TEXT,
                    source_hash TEXT
                )
            ''')
            db.execute('''
                UPDATE jobs SET status='error', message='Создание прервано перезапуском. Нажмите КСП для повтора.'
                WHERE status IN ('queued', 'generating', 'validating', 'saving')
            ''')

    @contextmanager
    def db(self):
        db = sqlite3.connect(self.db_path, timeout=5)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()

    def sync_existing_files(self):
        """Detect existing docx files on disk and register them as ready."""
        try:
            timetable_file = BASE / 'ksp-timetable.json'
            if not timetable_file.is_file():
                return
            schedule = json.loads(timetable_file.read_text(encoding='utf-8'))
            with self.db() as db:
                for key in schedule:
                    try:
                        src = lesson_source(key)
                        target = output_path(src, self.output_root)
                        if target.is_file():
                            row = db.execute('SELECT * FROM jobs WHERE key=?', (key,)).fetchone()
                            if not row or row['status'] != 'ready':
                                ident = row['id'] if row else uuid.uuid4().hex
                                db.execute(
                                    'INSERT OR REPLACE INTO jobs VALUES (?,?,?,?,?,?)',
                                    (key, ident, 'ready', 'КСП готов в Google Диске', str(target), src['source_hash'])
                                )
                    except Exception:
                        continue
        except Exception:
            pass

    def statuses(self):
        self.sync_existing_files()
        with self.db() as db:
            rows = db.execute('SELECT * FROM jobs').fetchall()
        return {r['key']: self.public(dict(r)) for r in rows}

    def public(self, row: dict) -> dict:
        result = {k: row[k] for k in ('id', 'status', 'message')}
        if row['status'] == 'ready':
            result['url'] = f"/api/ksp/{row['id']}/document"
        return result

    def update(self, key: str, status: str, message: str, path: str = ''):
        with self.db() as db:
            db.execute(
                'UPDATE jobs SET status=?, message=?, path=? WHERE key=?',
                (status, message, str(path), key)
            )

    def start(self, key: str) -> dict:
        source = lesson_source(key)
        target = output_path(source, self.output_root)

        with self.lock:
            with self.db() as db:
                row = db.execute('SELECT * FROM jobs WHERE key=?', (source['key'],)).fetchone()
                if row and row['status'] in ('queued', 'generating', 'validating', 'saving'):
                    return self.public(dict(row))
                if target.is_file():
                    ident = row['id'] if row else uuid.uuid4().hex
                    db.execute(
                        'INSERT OR REPLACE INTO jobs VALUES (?,?,?,?,?,?)',
                        (source['key'], ident, 'ready', 'КСП готов в Google Диске', str(target), source['source_hash'])
                    )
                    return dict(id=ident, status='ready', message='КСП готов в Google Диске', url=f"/api/ksp/{ident}/document")

                if not self.template.is_file():
                    raise ValueError('Не найден образец КСП (ksp_template.docx).')

                ident = uuid.uuid4().hex
                db.execute(
                    'INSERT OR REPLACE INTO jobs VALUES (?,?,?,?,?,?)',
                    (source['key'], ident, 'queued', 'В очереди…', '', source['source_hash'])
                )

            self.pool.submit(self.run, source)
        return dict(id=ident, status='queued', message='В очереди…')

    def run(self, source: dict):
        key = source['key']
        try:
            self.update(key, 'generating', 'Генерация Gemini…')
            plan = self.generator(source)
            self.update(key, 'validating', 'Проверка структуры…')
            validate_plan(plan, source)
            self.update(key, 'saving', 'Сборка DOCX…')
            target = output_path(source, self.output_root)
            build_docx(self.template, target, source, plan)
            self.update(key, 'ready', 'КСП сохранён в Google Диске', str(target))
        except Exception as exc:
            message = str(exc) if isinstance(exc, ValueError) else 'Ошибка генерации КСП. Повторите попытку.'
            self.update(key, 'error', message)


class KspStart(BaseModel):
    lesson_path: str


def install_routes(app, require_superadmin, reload_env=lambda: None):
    service = None
    init_lock = threading.Lock()

    def get_service():
        nonlocal service
        with init_lock:
            if service is None:
                service = KspService()
        return service

    def authorize(request: Request):
        access = require_superadmin(request)
        if isinstance(access, JSONResponse):
            # Check teacher or admin
            try:
                from server import get_user_from_request
                user = get_user_from_request(request)
                if user and user.get("role") in {"teacher", "admin", "superadmin"}:
                    return None
            except Exception:
                pass
            return access
        return None

    @app.get('/api/ksp')
    def statuses(request: Request):
        denied = authorize(request)
        if denied is not None:
            return denied
        return {'lessons': get_service().statuses()}

    @app.post('/api/ksp', status_code=202)
    def start(payload: KspStart, request: Request):
        denied = authorize(request)
        if denied is not None:
            return denied
        try:
            reload_env()
            return get_service().start(payload.lesson_path)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    @app.get('/api/ksp/{job_id}/document')
    def document(job_id: str, request: Request):
        denied = authorize(request)
        if denied is not None:
            return denied
        svc = get_service()
        with svc.db() as db:
            row = db.execute("SELECT path FROM jobs WHERE id=? AND status='ready'", (job_id,)).fetchone()
        if not row or not Path(row['path']).is_file():
            raise HTTPException(404, 'Документ не найден')
        path = Path(row['path']).resolve()
        return FileResponse(
            path,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            filename=path.name,
            content_disposition_type='attachment'
        )
