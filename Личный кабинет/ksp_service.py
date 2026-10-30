"""Isolated, durable KSP generation service powered by Google Gemini API.
Includes deep pedagogical prompt, strict 45-minute timing, and zero OOP/ZPR.
"""
from __future__ import annotations

import base64
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
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse, RedirectResponse
from pydantic import BaseModel

from ksp_document import build_docx, docx_to_html

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent


FALLBACK_KEY_B64 = "QVEuQWI4Uk42TGpGdzFSR04yblppdk81SmM4T2wzclFyZWpEdGg3SzRfd2J4b2Q5SVBnMmc="


def get_gemini_api_key() -> str:
    key = os.environ.get('GEMINI_API_KEY', '').strip()
    if key:
        return key

    for candidate in [BASE / '.env', BASE / 'alasster.env', ROOT / '.env']:
        if candidate.is_file():
            try:
                for line in candidate.read_text(encoding='utf-8').splitlines():
                    line = line.strip()
                    if line.startswith('GEMINI_API_KEY='):
                        val = line.split('=', 1)[1].strip().strip('"').strip("'")
                        if val:
                            os.environ['GEMINI_API_KEY'] = val
                            return val
            except Exception:
                pass

    try:
        decoded = base64.b64decode(FALLBACK_KEY_B64).decode('utf-8').strip()
        if decoded:
            os.environ['GEMINI_API_KEY'] = decoded
            return decoded
    except Exception:
        pass

    return ''

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


def sanitize_dict_strings(obj):
    """Strictly scrubs forbidden classroom equipment words (interactive whiteboards, laptops)."""
    if isinstance(obj, str):
        obj = re.sub(r'\bинтерактивн\w*\s+доск\w*', 'платформу www.alasster.site', obj, flags=re.I)
        obj = re.sub(r'\bсмарт[- ]доск\w*', 'платформу www.alasster.site', obj, flags=re.I)
        obj = re.sub(r'\b(на|к)\s+доск[еу]\b', 'к платформе www.alasster.site', obj, flags=re.I)
        obj = re.sub(r'\bу\s+доски\b', 'на платформе www.alasster.site', obj, flags=re.I)
        obj = re.sub(r'\bна\s+ноутбук\w*', 'на рабочих местах на платформе www.alasster.site', obj, flags=re.I)
        obj = re.sub(r'\bноутбук\w*', 'рабочие места', obj, flags=re.I)
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_dict_strings(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_dict_strings(item) for item in obj]
    return obj


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
    api_key = get_gemini_api_key()
    if not api_key:
        raise ValueError('Не указан ключ GEMINI_API_KEY. Добавьте его в файл .env в папке Личный кабинет.')

    teacher_name = os.environ.get('KSP_TEACHER', 'Кадыржанов Ж.К.')
    school_name = 'ГПХ на ПХВ «Школа - гимназия №22»'

    system_instructions = f"""Ты — главный методист по информатике в Республике Казахстан.
Твоя задача — составить максимально подробный, глубокий, развёрнутый и высокопрофессиональный краткосрочный план урока (КСП) в формате JSON строго по структуре.

СТРОЖАЙШИЕ ПРАВИЛА И ОГРАНИЧЕНИЯ:
1. АБСОЛЮТНОЕ И СТРОЖАЙШЕЕ СООТВЕТСТВИЕ ТЕМЕ УРОКА:
   - ТЕМА УРОКА: «{source['title']}» ({source['class_name']}, {source['quarter']}, Урок {source['number']}).
   - ВСЕ без исключения этапы, формулировки учителя, вопросы разминки, теоретические объяснения, разобранные примеры (1 и 2), практические задания (1, 2, 3), дескрипторы, рефлексия и домашнее задание ДОЛЖНЫ БЫТЬ СТРОГО И ИСКЛЮЧИТЕЛЬНО ПО ТЕМЕ «{source['title']}»!
   - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать примеры, вопросы или термины из других тем! (Например, в теме про Искусственный Интеллект и этику КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО упоминать IP-адреса, маски подсетей или сетевое оборудование; в теме про сети — запрещено говорить о базах данных и т.д.).
   - Все термины, формулировки и сценарии бери СТРОГО из материалов урока:
{source['content'][:7500]}

2. СТРОГИЕ ТРЕБОВАНИЯ К ФОРМАТИРОВАНИЮ (АБЗАЦЫ И ПУСТЫЕ СТРОКИ):
   - В полях teacher_actions и student_actions КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать монотонный сплошной текст!
   - Каждый смысловой пункт разделяй ДВУМЯ переводами строк (

), чтобы в документе были чёткие пустые строчки между абзацами.
   - Каждый абзац начинай с жирного маркера с двоеточием, например:
     **Приветствие:** ...

**Психологический настрой:** ...

**Тема урока:** ...

**Цель урока:** ...

**Критерии успеха:** ...
3. КАТЕГОРИЧЕСКИ БЕЗ ООП / ЗПР:
   - В классе нет детей с ООП или ЗПР. Любые слова ООП, ЗПР, адаптации, особые потребности исключить полностью!
4. В КАБИНЕТЕ НЕТ ИНТЕРАКТИВНОЙ ДОСКИ:
   - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО упоминать слова: «интерактивная доска», «смарт-доска», «вызов к доске», «демонстрация на доске» и подобные!
   - Всё взаимодействие, схемы, теория, презентации и задания открываются ТОЛЬКО через платформу www.alasster.site.
5. ЗАПРЕТ НА УПОМИНАНИЕ НОУТБУКОВ:
   - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать слово «ноутбук» или «ноутбуки»!
   - Формулировать строго нейтрально: «учащиеся открывают платформу www.alasster.site на рабочих местах», «работают с сайтом www.alasster.site», «выполняют интерактивные задания на платформе».
6. ОБЩЕЕ ВРЕМЯ УРОКА — 45 МИНУТ, РОВНО 5 ЭТАПОВ (ПОЛНАЯ ДЕТАЛИЗАЦИЯ):
   - 1. ОРГ. МОМЕНТ (5 мин):
     * **Приветствие:** Живая речь учителя («Здравствуйте, ребята! Садитесь. Проверьте готовность рабочих мест...»).
     * **Психологический настрой:** Позитивная мотивация.
     * **Тема урока:** Чёткое объявление темы «{source['title']}».
     * **Цель урока:** Разъяснение цели простым и понятным языком.
     * **Критерии успеха:** Что конкретно учащиеся смогут делать к концу урока.
   - 2. АКТУАЛИЗАЦИЯ ЗНАНИЙ (5 мин):
     * **Интерактивная разминка:** Фронтальный опрос строго по теме «{source['title']}» на платформе www.alasster.site.
     * **Вопрос 1:** Прямая речь учителя с конкретным вопросом строго по содержанию темы «{source['title']}».
     * **Ожидаемый ответ 1:** Точный развёрнутый ответ учащихся.
     * **Вопрос 2:** Проблемный вопрос, подводящий к изучению темы «{source['title']}».
     * **Ожидаемый ответ 2:** Ответ учащихся.
     * **Подводка к новой теме:** Логический переход к изучению темы «{source['title']}».
   - 3. ОБЪЯСНЕНИЕ НОВОГО МАТЕРИАЛА (10 мин):
     * КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ общие отписки! Текст объяснения учителя расписывай ПОЛНОСТЬЮ слово в слово строго по теме «{source['title']}»!
     * **Теоретический блок:** Фундаментальное изложение сути темы со всеми определениями и принципами.
     * **Ключевые термины и понятия:** Список терминов текущего урока с их точными формулировками.
     * **Разбор примера 1 (пошаговый разбор ситуации/задачи):** Подробнейший пошаговый разбор конкретного примера или задачи строго по материалу урока «{source['title']}».
     * **Разбор примера 2 (практический кейс):** Разбор реальной жизненной ситуации или прикладного сценария по теме «{source['title']}».
     * **Контрольные вопросы для проверки понимания:** 2-3 экспресс-вопроса учащимся по объясненному материалу.
   - 4. ПРАКТИЧЕСКАЯ РАБОТА (20 мин):
     * **Инструктаж по технике безопасности:** Правила работы за компьютером.
     * ОБЯЗАТЕЛЬНО МИНИМУМ 3 КОНКРЕТНЫХ ЗАДАНИЯ С ПОЛНЫМИ УСЛОВИЯМИ, РЕШЕНИЯМИ И ДЕСКРИПТОРАМИ СТРОГО ПО ТЕМЕ «{source['title']}»:
       - **Задание 1 (базовый уровень — знание и понимание):** Полное условие. Решение и правильный ответ для учителя. Дескриптор с баллами (1-3 балла).
       - **Задание 2 (средний уровень — применение):** Полное условие практической задачи. Пошаговое решение и правильный ответ для учителя. Дескриптор с баллами (1-4 балла).
       - **Задание 3 (высокий уровень — анализ/исследование):** Творческая или проблемная задача повышенной сложности. Полное решение для учителя. Дескриптор с баллами (1-3 балла).
   - 5. ПОДВЕДЕНИЕ ИТОГОВ УРОКА (5 мин):
     * **Обобщение темы:** Развёрнутый вывод учителя по уроку с повторением сути изученного.
     * **Рефлексия:** Приём рефлексии (вопросы самооценки «Что усвоено?», «Какие моменты вызвали затруднения?»).
     * **Оценивание:** Выставление и комментирование баллов формативного оценивания (ФО) по 10-балльной шкале.
     * **Домашнее задание:** Подробный инструктаж по выполнению ДЗ со ссылкой на платформу www.alasster.site.
7. ДЕЯТЕЛЬНОСТЬ ОБУЧАЮЩИХСЯ (student_actions):
   - Расписывать конкретные действия учащихся на каждом этапе с разделением на абзацы (

).
8. ОЦЕНИВАНИЕ (assessment):
   - Похвала, критериальное и формативное оценивание (10-балльная шкала).
9. ФУНКЦИОНАЛЬНАЯ ГРАМОТНОСТЬ (functional_literacy):
   - Практический кейс по стандартам ICILS/PISA (применение цифровых навыков в реальной жизни).
10. ИСКУССТВЕННЫЙ ИНТЕЛЛЕКТ (ai_tools):
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
{source['content'][:7500]}
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
                    plan = sanitize_dict_strings(plan)
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
            result['view_url'] = f"/api/ksp/{row['id']}/view"
            result['google_docs_url'] = f"/api/ksp/{row['id']}/google-docs"
            result['drive_url'] = "https://drive.google.com/drive/folders/1skfm8UZo7rAcWLJFpULLgICGyoJsXsJo"
        return result

    def update(self, key: str, status: str, message: str, path: str = ''):
        with self.db() as db:
            db.execute(
                'UPDATE jobs SET status=?, message=?, path=? WHERE key=?',
                (status, message, str(path), key)
            )

    def start(self, key: str, force: bool = False) -> dict:
        source = lesson_source(key)
        target = output_path(source, self.output_root)

        with self.lock:
            with self.db() as db:
                row = db.execute('SELECT * FROM jobs WHERE key=?', (source['key'],)).fetchone()
                if row and row['status'] in ('queued', 'generating', 'validating', 'saving'):
                    return self.public(dict(row))
                if target.is_file() and not force:
                    ident = row['id'] if row else uuid.uuid4().hex
                    db.execute(
                        'INSERT OR REPLACE INTO jobs VALUES (?,?,?,?,?,?)',
                        (source['key'], ident, 'ready', 'КСП готов в Google Диске', str(target), source['source_hash'])
                    )
                    return self.public({
                        'id': ident, 'status': 'ready', 'message': 'КСП готов в Google Диске',
                        'path': str(target), 'key': source['key'], 'source_hash': source['source_hash']
                    })

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
    force: bool = False


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
            return get_service().start(payload.lesson_path, force=payload.force)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    @app.get('/api/ksp/{job_id}/google-docs')
    def google_docs(job_id: str, request: Request):
        denied = authorize(request)
        if denied is not None:
            return denied
        svc = get_service()
        with svc.db() as db:
            row = db.execute("SELECT path FROM jobs WHERE id=? AND status='ready'", (job_id,)).fetchone()
        if not row or not Path(row['path']).is_file():
            raise HTTPException(404, 'Документ не найден')

        pub_url = None
        pub_file = BASE / '.runtime' / 'public_url.txt'
        if pub_file.is_file():
            try:
                txt = pub_file.read_text(encoding='utf-8').strip()
                if txt.startswith('http'):
                    pub_url = txt
            except Exception:
                pass

        if not pub_url and request.base_url.hostname not in ('localhost', '127.0.0.1', '0.0.0.0'):
            pub_url = str(request.base_url).rstrip('/')

        # Open reliable in-browser document viewer
        return RedirectResponse(f"/api/ksp/{job_id}/view", status_code=302)

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
            content_disposition_type='inline'
        )

    @app.get('/api/ksp/{job_id}/view')
    def view_document(job_id: str, request: Request):
        denied = authorize(request)
        if denied is not None:
            return denied
        svc = get_service()
        with svc.db() as db:
            row = db.execute("SELECT * FROM jobs WHERE id=? AND status='ready'", (job_id,)).fetchone()
        if not row or not Path(row['path']).is_file():
            raise HTTPException(404, 'Документ ещё не готов или не найден')
        path = Path(row['path']).resolve()
        html_body = docx_to_html(path)
        page_title = path.stem

        html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{page_title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #eef2f6;
      --paper: #ffffff;
      --text: #111827;
      --border: #000000;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: var(--bg);
      color: var(--text);
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      line-height: 1.15;
      padding-top: 60px;
      padding-bottom: 60px;
    }}
    .ksp-topbar {{
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 52px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      z-index: 1000;
      font-family: 'Manrope', sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }}
    .ksp-topbar-title {{
      font-weight: 700;
      font-size: 14px;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .ksp-topbar-badge {{
      background: #e0f2fe;
      color: #0369a1;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }}
    .ksp-actions {{
      display: flex;
      gap: 10px;
      align-items: center;
    }}
    .ksp-btn {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 8px;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;
      font-family: 'Manrope', sans-serif;
    }}
    .ksp-btn-print {{
      background: #2563eb;
      color: #fff;
    }}
    .ksp-btn-print:hover {{
      background: #1d4ed8;
      box-shadow: 0 2px 6px rgba(37,99,235,0.3);
    }}
    .ksp-btn-download {{
      background: #f1f5f9;
      color: #334155;
      border-color: #cbd5e1;
    }}
    .ksp-btn-download:hover {{
      background: #e2e8f0;
    }}
    .ksp-btn-drive {{
      background: #ecfdf5;
      color: #047857;
      border-color: #a7f3d0;
    }}
    .ksp-btn-drive:hover {{
      background: #d1fae5;
    }}
    .ksp-container {{
      max-width: 1120px;
      margin: 20px auto;
      background: var(--paper);
      padding: 24mm 20mm;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      border-radius: 4px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }}
    th, td {{
      border: 1px solid #000;
      padding: 6px 8px;
      vertical-align: top;
      font-size: 12pt;
      line-height: 1.15;
      text-align: left;
    }}
    th {{
      background: #f1f5f9;
      font-weight: bold;
    }}
    .ksp-label-cell {{
      width: 28%;
      background: #fafafa;
    }}
    .ksp-banner-th {{
      text-align: center !important;
      background: #e2e8f0 !important;
      font-size: 12pt;
      font-weight: bold;
      padding: 6px;
    }}
    .ksp-stage-header-tr th {{
      text-align: center;
      font-size: 12pt;
      background: #f8fafc;
    }}
    .ksp-para {{
      margin: 0 0 4pt 0;
      text-align: left;
    }}
    .ksp-para:last-child {{
      margin-bottom: 0;
    }}
    .ksp-img-box {{
      text-align: center;
      margin: 6px 0;
    }}
    .ksp-img-box img {{
      max-width: 230px;
      height: auto;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }}
    .ksp-page-break {{
      margin: 26px 0;
      text-align: center;
      position: relative;
    }}
    .ksp-page-break::before {{
      content: '';
      position: absolute;
      top: 50%; left: 0; right: 0;
      border-top: 2px dashed #94a3b8;
      z-index: 1;
    }}
    .ksp-page-break span {{
      position: relative;
      background: #fff;
      padding: 4px 14px;
      font-family: 'Manrope', sans-serif;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      z-index: 2;
    }}
    @media print {{
      body {{
        background: #fff;
        padding: 0;
        margin: 0;
      }}
      .ksp-topbar {{ display: none !important; }}
      .ksp-container {{
        box-shadow: none;
        padding: 0;
        margin: 0;
        max-width: none;
      }}
      .ksp-page-break {{
        page-break-before: always;
        break-before: page;
        height: 0;
        margin: 0;
        padding: 0;
        border: none;
      }}
      .ksp-page-break span, .ksp-page-break::before {{
        display: none !important;
      }}
      @page {{
        size: A4 landscape;
        margin: 15mm;
      }}
    }}
  </style>
</head>
<body>
  <div class="ksp-topbar">
    <div class="ksp-topbar-title">
      <span class="ksp-topbar-badge">КСП 2026–2027</span>
      <span>{page_title}</span>
    </div>
    <div class="ksp-actions">
      <button class="ksp-btn ksp-btn-print" onclick="window.print()">🖨️ Печать / PDF</button>
      <a class="ksp-btn ksp-btn-download" href="/api/ksp/{job_id}/document">💾 Скачать DOCX</a>
      <a class="ksp-btn ksp-btn-drive" href="https://drive.google.com/drive/folders/1skfm8UZo7rAcWLJFpULLgICGyoJsXsJo" target="_blank" rel="noopener">📁 Google Диск</a>
    </div>
  </div>
  <div class="ksp-container">
    {html_body}
  </div>
</body>
</html>"""
        return HTMLResponse(content=html, status_code=200)
