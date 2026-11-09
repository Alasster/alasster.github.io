"""Isolated, durable KSP generation service powered by Google Gemini API.
Includes deep pedagogical prompt, strict 45-minute timing, and zero OOP/ZPR.
Supports both standard KSP and variative ("Доп") KSP for 10A OGN on Tuesdays.
"""
from __future__ import annotations
import ksp_content

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
from datetime import datetime, timedelta
from html import unescape
from pathlib import Path
from urllib.parse import unquote

import httpx
from fastapi import HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse, RedirectResponse
from pydantic import BaseModel

from ksp_document import build_docx, docx_to_html, get_weekly_quote
import ksp_drive

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


def get_google_drive_file_url(file_path: str | Path) -> str | None:
    """Resolve direct Google Docs edit URL from local Google Drive for Desktop database."""
    file_path = Path(file_path)
    file_name = file_path.name
    drivefs_dir = Path(os.environ.get('LOCALAPPDATA', '')) / 'Google' / 'DriveFS'
    if not drivefs_dir.is_dir():
        return None

    for acc_dir in drivefs_dir.iterdir():
        if not acc_dir.is_dir():
            continue
        p_meta = acc_dir / 'mirror_metadata_sqlite.db'
        p_mirror = acc_dir / 'mirror_sqlite.db'
        if p_meta.is_file() and p_mirror.is_file():
            try:
                db_meta = sqlite3.connect(f'file:{p_meta}?mode=ro', uri=True)
                db_mirror = sqlite3.connect(f'file:{p_mirror}?mode=ro', uri=True)
                rows = db_mirror.execute(
                    "SELECT stable_id, parent_local_stable_id FROM mirror_item WHERE local_filename=? OR cloud_filename=? ORDER BY local_mtime_ms DESC",
                    (file_name, file_name)
                ).fetchall()
                want = [x for x in file_path.parts[:-1]][::-1]  # parent folders, nearest first
                for stable_id, parent_id in rows:
                    # verify folder chain (class / quarter) so same-named files in other classes don't collide
                    ok, cur = True, parent_id
                    for name in want[:3]:
                        prow = db_mirror.execute(
                            "SELECT local_filename, parent_local_stable_id FROM mirror_item WHERE local_stable_id=?", (cur,)
                        ).fetchone()
                        if not prow or prow[0] != name:
                            ok = False
                            break
                        cur = prow[1]
                    if not ok:
                        continue
                    item_row = db_meta.execute("SELECT id FROM items WHERE stable_id=?", (stable_id,)).fetchone()
                    if item_row and item_row[0] and not str(item_row[0]).startswith('local-'):
                        return f"https://docs.google.com/document/d/{item_row[0]}/edit"
            except Exception:
                pass
    return None


def drive_available() -> bool:
    """True only on a PC with Google Drive for Desktop (where KSP can be saved into Мой диск)."""
    if os.environ.get('KSP_OUTPUT_ROOT'):
        return True
    local = os.environ.get('LOCALAPPDATA', '')
    return bool(local) and (Path(local) / 'Google' / 'DriveFS').is_dir()


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


def _shift_monday_to_tuesday(date_str: str) -> str:
    try:
        dt = datetime.strptime(date_str.strip(), '%d.%m.%Y')
        if dt.weekday() == 0:  # Monday -> Tuesday
            return (dt + timedelta(days=1)).strftime('%d.%m.%Y')
    except Exception:
        pass
    return date_str


def lesson_source(key: str) -> dict:
    """Extract authoritative lesson metadata from project, q2 data, and confirmed timetable."""
    raw_key = unquote(key).strip()
    is_variative = False
    if raw_key.startswith('доп|'):
        is_variative = True
        clean_key = raw_key[len('доп|'):].lstrip('/')
        canonical_key = f'доп|{clean_key}'
    else:
        clean_key = raw_key.lstrip('/')
        canonical_key = clean_key

    path = (ROOT / clean_key).resolve()
    if not path.is_relative_to(ROOT.resolve()) or path.suffix != '.html':
        raise ValueError('Недопустимый путь урока')
    parts = path.relative_to(ROOT).parts
    if len(parts) != 3 or parts[0] == 'Python основы':
        raise ValueError('КСП доступен для школьных уроков (кроме Python основы)')
    if is_variative and parts[0] != '10 ОГН':
        raise ValueError('Вариативный КСП (Доп) доступен только для 10 ОГН (10А класс)')
    if not path.is_file():
        raise ValueError('Файл урока не найден')

    num = re.search(r'\d+', path.stem).group() if re.search(r'\d+', path.stem) else '1'
    class_name = parts[0]
    quarter = parts[1]

    # For Quarter 2: extract rich structured content directly from q2-data-*.js
    q2_data = {}
    if quarter == '2 четверть':
        try:
            q2_data = ksp_content.get_q2_lesson_text(class_name, num)
        except Exception:
            q2_data = {}

    html = path.read_text(encoding='utf-8-sig')
    heading = re.search(r'<h1\b[^>]*>(.*?)</h1>', html, re.S | re.I)
    title = q2_data.get('title') or (re.sub(r'\s+', ' ', plain(heading.group(1))) if heading else path.stem)

    # Extract goal from lesson HTML definition
    definitions = re.findall(r'<div\b[^>]*class=[\'"][^\'"]*\bdefinition\b[^\'"]*[\'"][^>]*>(.*?)</div>', html, re.S | re.I)
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
    slot = (schedule.get(canonical_key) or schedule.get(clean_key, {})) if is_variative else schedule.get(clean_key, {})

    goals = list(slot.get('goals') or [])
    if not goals and q2_data.get('goal'):
        goals = [q2_data['goal']]
    if not goals and html_goals:
        goals = html_goals
    if not goals:
        goals = [f"{class_name}: освоение темы «{title}»"]

    dates = re.findall(r'(?<!\d)(?:\d{2}\.\d{2}\.20\d{2}|20\d{2}-\d{2}-\d{2})(?!\d)', plain(html))
    date_val = slot.get('date') or (dates[0] if dates else '07.09.2026')
    if is_variative and canonical_key not in schedule:
        date_val = _shift_monday_to_tuesday(date_val)

    section_val = slot.get('section') or 'Информатика'
    theme_val = q2_data.get('title') or slot.get('theme') or title

    lesson_content = q2_data.get('content') or plain(html)
    hash_seed = f"variative:{html}" if is_variative else html

    return dict(
        key=canonical_key,
        lesson_path=clean_key,
        is_variative=is_variative,
        class_name=class_name,
        folder_name='10 ДОП' if is_variative else class_name,
        grade_label='10 «А» класс (ОГН)' if is_variative else class_name,
        subject='Информатика и искусственный интеллект (вариативный компонент)' if is_variative else 'Информатика',
        quarter=quarter,
        number=num,
        title=theme_val,
        goals=goals,
        date=date_val,
        section=section_val,
        duration=45,
        language='ru',
        content=lesson_content,
        source_hash=hashlib.sha256(hash_seed.encode()).hexdigest()
    )


def safe_name(value: str) -> str:
    return re.sub(r'[<>:"/\\|?*\x00-\x1f]', ' ', value).strip(' .')[:145]


def output_path(source: dict, output_root: Path) -> Path:
    folder_class = source.get('folder_name') or ('10 ДОП' if source.get('is_variative') else source['class_name'])
    if source.get('is_variative'):
        filename = f"Урок {int(source['number']):02d} Доп КСП (10А) — {safe_name(source['title'])}.docx"
    else:
        filename = f"Урок {int(source['number']):02d} КСП — {safe_name(source['title'])}.docx"
    return (
        output_root / '2026–2027' / folder_class / source['quarter'] / filename
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
    quote_info = get_weekly_quote(source.get('date', ''), source.get('number', ''))
    is_variative = bool(source.get('is_variative'))

    if is_variative:
        timing_and_stages_block = f"""6. ОСОБЕННОСТЬ ВАРИАТИВНОГО УРОКА ДЛЯ 10 «А» КЛАССА (ОГН) ПО ВТОРНИКАМ (45 МИНУТ, 5 ЭТАПОВ — МЕНЬШЕ ТЕОРИИ, БОЛЬШЕ УГЛУБЛЕННОЙ ПРАКТИКИ):
   - Это вариативный курс «Информатика и искусственный интеллект. Вариативный компонент» специально для 10 «А» класса ОГН (урок проходит по вторникам, дата: {source['date']}).
   - Учащиеся 10 «А» класса работают с тем же уроком на платформе www.alasster.site, что и на основном уроке, но занятие построено с минимальным объёмом повторной теории и максимальным упором на практику, исследование, эксперименты и дополнительные задания повышенной сложности в соответствии с целями вариативного КТП: {' '.join(source['goals'])}.
   - РАСПРЕДЕЛЕНИЕ ВРЕМЕНИ (РОВНО 5 ЭТАПОВ, 45 МИНУТ):
     - 1. ОРГ. МОМЕНТ (5 мин):
       * **Приветствие:** Живая речь учителя для 10 «А» класса («Здравствуйте, ребята! Садитесь. Проверьте готовность рабочих мест...»).
       * **Психологический настрой:** Мотивация на углублённый практикум и исследовательскую работу.
       * **Тема урока:** Чёткое объявление темы вариативного занятия «{source['title']}».
       * **Цель урока:** Разъяснение углублённых целей обучения вариативного курса.
       * **Критерии успеха:** Конкретные практические и исследовательские результаты учащихся к концу урока.
     - 2. АКТУАЛИЗАЦИЯ ЗНАНИЙ (5 мин):
       * **Интерактивная разминка:** Быстрый блиц-опрос по базовым вопросам урока на платформе www.alasster.site (из раздела «АКТУАЛИЗАЦИЯ И РАЗМИНКА (ВОПРОСЫ С ПЛАТФОРМЫ)»).
       * **Вопрос 1:** Конкретный вопрос строго по теме «{source['title']}».
       * **Ожидаемый ответ 1:** Точный ответ учащихся.
       * **Вопрос 2:** Проблемный вопрос на сопоставление, анализ или выбор метода по теме «{source['title']}».
       * **Ожидаемый ответ 2:** Ответ учащихся.
       * **Подводка к углубленной практике:** Переход от базовых понятий сразу к практическому моделированию и решению расширенных задач.
     - 3. ОБЪЯСНЕНИЕ НОВОГО МАТЕРИАЛА (5 мин — краткий концентрат теории с акцентом на практику):
       * Без длинных лекций: сжатое повторение опорных правил с платформы www.alasster.site и разбор тонкостей для выполнения углублённой практики по теме «{source['title']}».
       * **Теоретический блок (краткий концентрат):** Сжатая выжимка ключевых закономерностей, формул или конструкций темы «{source['title']}».
       * **Ключевые понятия и алгоритмические приёмы:** Опорные ориентиры и правила анализа данных/кода.
       * **Разбор ключевого примера:** Конкретный прикладной разбор по материалам платформы www.alasster.site с анализом пограничных случаев и типичных ошибок.
       * **Контрольный вопрос перед практикой:** 1-2 быстрых вопроса на готовность к самостоятельной работе.
     - 4. ПРАКТИЧЕСКАЯ РАБОТА (25 мин — основной фокус урока + дополнительные углубленные задания):
       * **Инструктаж по технике безопасности:** Правила работы за компьютером и соблюдение академической честности.
       * ОБЯЗАТЕЛЬНО ВКЛЮЧИ 5 КОНКРЕТНЫХ ЗАДАНИЙ С ПОЛНЫМИ УСЛОВИЯМИ, РЕШЕНИЯМИ И ДЕСКРИПТОРАМИ СТРОГО ПО ТЕМЕ «{source['title']}» (3 задания с платформы www.alasster.site + 2 дополнительных углублённых задания вариативного курса):
         - **Задание 1 (базовый практикум с платформы):** Полное условие задания с платформы www.alasster.site. Решение и правильный ответ для учителя. Дескриптор: качественные критерии выполнения (без баллов).
         - **Задание 2 (прикладной практикум с платформы):** Полное условие второго задания с платформы www.alasster.site. Пошаговое решение и правильный ответ для учителя. Дескриптор: качественные критерии выполнения (без баллов).
         - **Задание 3 (профильный практикум с платформы):** Полное условие третьего задания с платформы www.alasster.site. Решение и правильный ответ для учителя. Дескриптор: качественные критерии выполнения (без баллов).
         - **Дополнительное задание 4 (углублённый вариативный уровень — модификация и эксперимент):** Дополнительная практическая задача повышенной сложности по теме «{source['title']}», развивающая материал урока (самостоятельная настройка параметров, расширение кода/модели, серия испытаний на новых наборах данных). Полное условие, подробное решение и правильный ответ для учителя. Дескриптор: качественные критерии выполнения (без баллов).
         - **Дополнительное задание 5 (исследовательский уровень — анализ и обоснование):** Дополнительное исследовательское или аналитическое задание по целям вариативного КТП («{' '.join(source['goals'])}» — сравнение эффективности, поиск ошибок/ограничений, аргументированный вывод). Полное условие, эталонное решение и выводы для учителя. Дескриптор: качественные критерии выполнения (без баллов).
     - 5. ПОДВЕДЕНИЕ ИТОГОВ УРОКА (5 мин):
       * **Обобщение темы:** Вывод учителя по результатам углублённого практикума.
       * **Рефлексия:** Самооценка выполнения базовых и дополнительных заданий («Что удалось протестировать и доказать?», «Какая задача потребовала наибольшего анализа?»).
       * **Оценивание:** Устное качественное формативное оценивание (БЕЗ баллов, БЕЗ отметок и БЕЗ 10-балльной шкалы, т.к. вариативный курс не оценивается в журнале): содержательный устный комментарий учителя, словесная похвала, акцент на успешных исследовательских решениях и прогрессе учеников, техника обратной связи «Похвала – Вопрос – Рекомендация».
       * **Домашнее задание:** Инструктаж по выполнению ДЗ и повторению на платформе www.alasster.site."""
    else:
        timing_and_stages_block = f"""6. ОБЩЕЕ ВРЕМЯ УРОКА — 45 МИНУТ, РОВНО 5 ЭТАПОВ (ПОЛНАЯ ДЕТАЛИЗАЦИЯ):
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
       * **Домашнее задание:** Подробный инструктаж по выполнению ДЗ со ссылкой на платформу www.alasster.site."""

    assessment_rule = """8. ОЦЕНИВАНИЕ (assessment):
   - Безотметочное качественное формирующее оценивание (словесная похвала учителя, содержательная устная обратная связь, самооценивание, взаимооценивание по технике «Две звезды и одно пожелание»).
   - СТРОЖАЙШИЙ ЗАПРЕТ: Вариативный курс НЕ оценивается в журнале! КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать 10-балльную шкалу, выставлять баллы, ставить отметки или писать «N баллов» в дескрипторах и графах оценивания! Оценивание формулируется строго в качественной и устной форме (комментарии учителя, устное поощрение, критериальные ориентиры без баллов).""" if is_variative else """8. ОЦЕНИВАНИЕ (assessment):
   - Похвала, критериальное и формативное оценивание (10-балльная шкала)."""

    system_instructions = f"""Ты — главный методист по информатике в Республике Казахстан.
Твоя задача — составить максимально подробный, глубокий, развёрнутый и высокопрофессиональный краткосрочный план урока (КСП) в формате JSON строго по структуре.

СТРОЖАЙШИЕ ПРАВИЛА И ОГРАНИЧЕНИЯ:
1. АБСОЛЮТНОЕ И СТРОЖАЙШЕЕ СООТВЕТСТВИЕ ТЕМЕ УРОКА:
   - ТЕМА УРОКА: «{source['title']}» ({source.get('grade_label') or source['class_name']}, {source['quarter']}, Урок {source['number']}).
   - ВСЕ без исключения этапы, формулировки учителя, вопросы разминки, теоретические объяснения, разобранные примеры, практические задания, дескрипторы, рефлексия и домашнее задание ДОЛЖНЫ БЫТЬ СТРОГО И ИСКЛЮЧИТЕЛЬНО ПО ТЕМЕ «{source['title']}»!
   - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать примеры, вопросы или термины из других тем! (Например, в теме про Искусственный Интеллект и этику КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО упоминать IP-адреса, маски подсетей или сетевое оборудование; в теме про сети — запрещено говорить о базах данных и т.д.).
   - Все термины, формулировки и сценарии бери СТРОГО из материалов урока:
{source['content'][:25000]}

- СТРОЖАЙШЕЕ ПРАВИЛО ИСПОЛЬЗОВАНИЯ МАТЕРИАЛОВ САЙТА:
   * Во 2 этапе (Актуализация): вопросы разминки, варианты ответов и объяснения бери СТРОГО из раздела «АКТУАЛИЗАЦИЯ И РАЗМИНКА (ВОПРОСЫ С ПЛАТФОРМЫ)».
   * В 3 этапе (Объяснение): теоретические понятия, правила, термины и пошаговые разборы излагай СТРОГО по разделу «ОБЪЯСНЕНИЕ НОВОГО МАТЕРИАЛА (ТЕОРИЯ С ПЛАТФОРМЫ)».
   * В 4 этапе (Практическая работа): формулировки заданий 1, 2, 3, решения и дескрипторы оценивания бери СТРОГО из раздела «ПРАКТИЧЕСКАЯ РАБОТА И ЗАДАНИЯ (СТРОГО С ПЛАТФОРМЫ)»{', а также обязательно добавь Дополнительное задание 4 и Дополнительное задание 5 повышенной сложности строго по теме урока и целям вариативного КТП!' if is_variative else '. Никаких выдуманных сторонних задач!'}.

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
{timing_and_stages_block}
7. ДЕЯТЕЛЬНОСТЬ ОБУЧАЮЩИХСЯ (student_actions):
   - Расписывать конкретные действия учащихся на каждом этапе с разделением на абзацы (

).
{assessment_rule}
9. ФУНКЦИОНАЛЬНАЯ ГРАМОТНОСТЬ (functional_literacy):
   - Практический кейс по стандартам ICILS/PISA (применение цифровых навыков в реальной жизни).
10. ИСКУССТВЕННЫЙ ИНТЕЛЛЕКТ (ai_tools):
   - Chat gpt, google ai studio, claude, copilot, gemini — конкретные сценарии применения учителем при подготовке и учениками для проверки.

11. ПРИВИТИЕ ЦЕННОСТЕЙ И ЦИТАТА НЕДЕЛИ (header.values):
    - ОФИЦИАЛЬНАЯ УТВЕРЖДЁННАЯ ЦИТАТА НЕДЕЛИ ИЗ ФАЙЛА «Файлы/Цитаты.csv» НА ДАТУ {source['date']}:
      * Казахский: {quote_info['kz']}
      * Русский: {quote_info['ru']}
    - Поле header.values ОБЯЗАТЕЛЬНО оформи в виде трёх чётких блоков, разделённых двойным переносом строк:
      **Цитата недели:** {quote_info['kz']} ({quote_info['ru']})
      **Привитие ценностей:** (в рамках концепции «Адал азамат» и программы «Біртұтас тәрбие» — честность, справедливость, ответственность за цифровые решения, добросовестный труд).
      **Связь с темой урока:** (2-3 развёрнутых предложения, подробно и глубоко раскрывающих, как смысл цитаты недели «{quote_info['ru']}» прямо соотносится с изучаемой темой «{source['title']}»).
12. СВЯЗЫВАНИЕ С ЦИТАТОЙ НЕДЕЛИ И ЦЕННОСТЯМИ В ЭТАПАХ УРОКА (teacher_actions):
    - В деятельности учителя ОБЯЗАТЕЛЬНО включи по 1-2 предложения, связывающих материал урока с этой утверждённой Цитатой недели:
      * В 1. Орг. момент: учитель озвучивает утверждённую цитату недели «{quote_info['kz']} ({quote_info['ru']})» в приветствии и связывает её со стремлением к знаниям и честному труду.
      * В 3. Объяснение нового материала: учитель подчёркивает моральную ответственность («Адал азамат») и принципы честности при работе с технологиями.
      * В 4. Практическая работа: учитель напоминает об академической честности и самостоятельности при выполнении заданий на платформе www.alasster.site.
      * В 5. Итоги урока: учитель обобщает урок выводом, перекликающимся со смыслом цитаты недели «{quote_info['ru']}».
13. РЕСУРСЫ УРОКА (resources):
    - Для каждого этапа в поле resources ОБЯЗАТЕЛЬНО укажи конкретные разделы платформы www.alasster.site, используемые на данном этапе (например: «Платформа www.alasster.site: Раздел 1 «Введение»», «Платформа www.alasster.site: Раздел 3 «...», Раздел 4 «...»»).

ДАННЫЕ УРОКА:
- Школа: {school_name}
- ФИО учителя: {teacher_name}
- Предмет: {source.get('subject') or 'Информатика'}
- Класс: {source.get('grade_label') or source['class_name']}
- Раздел: {source['section']}
- Дата: {source['date']}
- Тема урока: {source['title']}. Урок {source['number']}{' (Вариативный курс)' if is_variative else ''}
- Цели обучения: {' '.join(source['goals'])}
- Материалы урока сайта:
{source['content'][:25000]}
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
        self.local = drive_available()                      # PC with Google Drive for Desktop
        self.cloud = (not self.local) and ksp_drive.configured()  # Render: Google Drive API
        self.drive = ksp_drive.DriveClient() if self.cloud else None
        self._index = {}
        self._index_ts = 0.0
        self._last_upload_ts = 0.0
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

    def _ensure_local_pool(self, min_slots: int = 120):
        """Maintain a hidden pool of user-owned placeholder files in КСП/.pool so Render can claim them."""
        if not self.local:
            return
        try:
            pool_dir = self.output_root / '.pool'
            pool_dir.mkdir(parents=True, exist_ok=True)
            existing = list(pool_dir.glob('slot_*.docx'))
            if len(existing) < min_slots:
                for i in range(1, min_slots + 40):
                    slot = pool_dir / f'slot_{i:03d}.docx'
                    if not slot.exists():
                        slot.write_bytes(b'PK\x03\x04placeholder')
        except Exception:
            pass

    def _all_lesson_keys(self) -> set[str]:
        timetable_file = BASE / 'ksp-timetable.json'
        schedule = json.loads(timetable_file.read_text(encoding='utf-8')) if timetable_file.is_file() else {}
        all_keys = set(schedule.keys())
        for p in ROOT.glob('*/*/* урок.html'):
            if p.parts[0] != 'Python основы':
                rel = str(p.relative_to(ROOT)).replace('\\', '/')
                all_keys.add(rel)
                if p.parts[0] == '10 ОГН':
                    all_keys.add(f'доп|{rel}')
        return all_keys

    def sync_existing_files(self):
        """Detect existing docx files on disk and register them as ready (or remove if deleted)."""
        if self.cloud:
            return self.sync_cloud()
        if not self.local:
            return
        self._ensure_local_pool()
        try:
            all_keys = self._all_lesson_keys()
            with self.db() as db:
                for key in all_keys:
                    try:
                        src = lesson_source(key)
                        target = output_path(src, self.output_root)
                        row = db.execute('SELECT * FROM jobs WHERE key=?', (key,)).fetchone()
                        if target.is_file():
                            if not row or row['status'] != 'ready':
                                ident = row['id'] if row else uuid.uuid4().hex
                                db.execute(
                                    'INSERT OR REPLACE INTO jobs VALUES (?,?,?,?,?,?)',
                                    (key, ident, 'ready', 'КСП готов в Google Диске', str(target), src['source_hash'])
                                )
                        elif row and row['status'] == 'ready':
                            db.execute('DELETE FROM jobs WHERE key=?', (key,))
                    except Exception:
                        continue
        except Exception:
            pass

    def sync_cloud(self, max_age: float = 5.0):
        """Cloud mode: the Google Drive folder is the source of truth (Render disk is ephemeral)."""
        import time
        if time.time() - self._index_ts < max_age:
            return
        try:
            index = self.drive.index_docs()
        except Exception:
            return
        if not index:
            return
        self._index, self._index_ts = index, time.time()
        try:
            all_keys = self._all_lesson_keys()
            with self.db() as db:
                for key in all_keys:
                    try:
                        src = lesson_source(key)
                    except Exception:
                        continue
                    folder_class = src.get('folder_name') or ('10 ДОП' if src.get('is_variative') else src['class_name'])
                    title = output_path(src, self.output_root).stem
                    doc_id = (
                        index.get((folder_class, src['quarter'], title))
                        or index.get((folder_class, src['quarter'], f'{title}.docx'))
                        or (index.get((src['class_name'], src['quarter'], title)) if src.get('is_variative') else None)
                        or (index.get((src['class_name'], src['quarter'], f'{title}.docx')) if src.get('is_variative') else None)
                    )
                    row = db.execute('SELECT * FROM jobs WHERE key=?', (key,)).fetchone()
                    if doc_id:
                        if row and row['status'] in ('queued', 'generating', 'validating', 'saving'):
                            continue
                        ident = row['id'] if row else uuid.uuid4().hex
                        db.execute('INSERT OR REPLACE INTO jobs VALUES (?,?,?,?,?,?)',
                                   (key, ident, 'ready', 'КСП готов в Google Диске', f'gdrive:{doc_id}', src['source_hash']))
                    elif row and row['status'] == 'ready' and str(row['path']).startswith('gdrive:'):
                        file_id = str(row['path'])[7:]
                        if file_id not in index.values() and (time.time() - self._last_upload_ts > 15.0):
                            db.execute('DELETE FROM jobs WHERE key=?', (key,))  # doc was deleted from Drive
        except Exception:
            pass

    def statuses(self):
        self.sync_existing_files()
        with self.db() as db:
            rows = db.execute('SELECT * FROM jobs').fetchall()
        out = {}
        for r in rows:
            pub = self.public(dict(r))
            if pub is not None:
                out[r['key']] = pub
        return out

    def public(self, row: dict) -> dict | None:
        result = {k: row[k] for k in ('id', 'status', 'message')}
        if row.get('status') == 'ready':
            if self.local and row.get('path') and not str(row['path']).startswith('gdrive:') and not Path(row['path']).is_file():
                return None
            result['url'] = f"/api/ksp/{row['id']}/document"
            result['view_url'] = f"/api/ksp/{row['id']}/google-docs"

            # Resolve direct Google Docs edit URL
            file_path = row.get('path')
            direct_docs_url = None
            if file_path and str(file_path).startswith('gdrive:'):
                direct_docs_url = f"https://docs.google.com/document/d/{str(file_path)[7:]}/edit"
            elif file_path:
                try:
                    direct_docs_url = get_google_drive_file_url(file_path)
                except Exception:
                    pass
            result['google_docs_url'] = direct_docs_url or f"/api/ksp/{row['id']}/google-docs"
            result['drive_url'] = "https://drive.google.com/drive/folders/18h133lNzCI2QeKfuLQmbZjDvlLSZ4Yq9"
        return result

    def update(self, key: str, status: str, message: str, path: str = ''):
        with self.db() as db:
            db.execute(
                'UPDATE jobs SET status=?, message=?, path=? WHERE key=?',
                (status, message, str(path), key)
            )

    def start(self, key: str, force: bool = False) -> dict:
        source = lesson_source(key)
        if not (self.local or self.cloud):
            raise ValueError('Не удалось подключиться к Google Диску.')
        target = output_path(source, self.output_root)

        if self.cloud and not force:
            self.sync_cloud(max_age=0.0)

        with self.lock:
            with self.db() as db:
                row = db.execute('SELECT * FROM jobs WHERE key=?', (source['key'],)).fetchone()
                if row and row['status'] in ('queued', 'generating', 'validating', 'saving'):
                    return self.public(dict(row)) or dict(id=row['id'], status=row['status'], message=row['message'])

                if self.cloud and row and row['status'] == 'ready' and str(row['path']).startswith('gdrive:') and not force:
                    doc_id = str(row['path'])[7:]
                    if self.drive.file_exists(doc_id):
                        return self.public(dict(row))
                    else:
                        db.execute('DELETE FROM jobs WHERE key=?', (source['key'],))

                if self.local and target.is_file() and not force:
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
            if self.cloud:
                tmp = self.state / 'out_cloud' / f'{uuid.uuid4().hex}.docx'
                tmp.parent.mkdir(parents=True, exist_ok=True)
                try:
                    build_docx(self.template, tmp, source, plan)
                    self.update(key, 'saving', 'Загрузка в Google Диск…')
                    folder_class = source.get('folder_name') or ('10 ДОП' if source.get('is_variative') else source['class_name'])
                    title = output_path(source, self.output_root).stem
                    doc_id = self.drive.upload_docx_as_gdoc(tmp, [folder_class, source['quarter']], title)
                    import time
                    self._last_upload_ts = time.time()
                    self._index_ts = time.time()
                    self._index[(folder_class, source['quarter'], title)] = doc_id
                    self._index[(folder_class, source['quarter'], f'{title}.docx')] = doc_id
                    self.update(key, 'ready', 'КСП сохранён в Google Диске', f'gdrive:{doc_id}')
                    return
                finally:
                    if tmp.exists():
                        try:
                            tmp.unlink(missing_ok=True)
                        except Exception:
                            pass
            target = output_path(source, self.output_root)
            build_docx(self.template, target, source, plan)
            import time
            for _ in range(45):  # wait up to ~90s for Google Drive to register the file
                if get_google_drive_file_url(target):
                    break
                time.sleep(2)
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
                user_role = None
                if user:
                    try:
                        user_role = user["role"]
                    except Exception:
                        user_role = getattr(user, "role", None)
                if user and user_role in {"teacher", "admin", "superadmin"}:
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
        resp = JSONResponse({'lessons': get_service().statuses()})
        resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        resp.headers['Pragma'] = 'no-cache'
        return resp

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
        if row and str(row['path']).startswith('gdrive:'):
            return RedirectResponse(f"https://docs.google.com/document/d/{str(row['path'])[7:]}/edit", status_code=302)
        if not row or not Path(row['path']).is_file():
            raise HTTPException(404, 'Документ не найден')

        file_path = Path(row['path'])
        import time
        drive_url = None
        for _ in range(10):
            drive_url = get_google_drive_file_url(file_path)
            if drive_url:
                break
            time.sleep(1)
        if drive_url:
            return RedirectResponse(drive_url, status_code=302)

        # Fallback to the 2026–2027 folder on Google Drive
        return RedirectResponse("https://drive.google.com/drive/folders/1GWtxb0KmS5kHJmaHMow_yf1I-8aVL5M_", status_code=302)

    @app.get('/api/ksp/{job_id}/document')
    def document(job_id: str, request: Request):
        denied = authorize(request)
        if denied is not None:
            return denied
        svc = get_service()
        with svc.db() as db:
            row = db.execute("SELECT path FROM jobs WHERE id=? AND status='ready'", (job_id,)).fetchone()
        if row and str(row['path']).startswith('gdrive:'):
            return RedirectResponse(f"https://docs.google.com/document/d/{str(row['path'])[7:]}/export?format=docx", status_code=302)
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
        return RedirectResponse(f"/api/ksp/{job_id}/google-docs", status_code=302)
