"""Robust, template-preserving DOCX builder and HTML viewer for Kazakhstan KSP lesson plans using python-docx.
- Strict 12pt Times New Roman everywhere.
- Table 1 starts on Page 2.
- Normal horizontal text direction everywhere (all w:textDirection stripped).
- Distinct paragraphs with blank line spacing (space_after = Pt(5), space_before = Pt(2)) and bold section titles.
- Captures, caches and embeds real section screenshots for all interactive lesson stages from www.alasster.site.
- Strictly zero mentions of OOP / ZPR, interactive whiteboards, or laptops.
"""
from __future__ import annotations

import base64
import hashlib
import os
import re
import subprocess
import shutil
import glob
import tempfile
from pathlib import Path
import docx
from docx.shared import Pt, Inches
from docx.enum.text import WD_BREAK, WD_ALIGN_PARAGRAPH

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent

FONT_SIZE = Pt(12)
FONT_NAME = 'Times New Roman'

SCREENSHOTS_DIR = BASE / '.runtime' / 'ksp' / 'screenshots'
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

def cleanup_ksp_temp_files(slide_shots: dict | None = None):
    """Automatically cleans up temporary html files in %TEMP%."""
    # Clean temporary HTML files in %TEMP%
    temp_dir = tempfile.gettempdir()
    for pattern in ('temp_*_*.html', 'ksp_slide_*.html'):
        for f in glob.glob(os.path.join(temp_dir, pattern)):
            try:
                os.unlink(f)
            except Exception:
                pass



def get_lesson_slides_meta(lesson_relative_path: str) -> list[dict]:
    """Extract section titles and metadata for all slides in the lesson."""
    lesson_path = (ROOT / lesson_relative_path.lstrip('/')).resolve()
    if not lesson_path.is_file():
        return []
    try:
        html = lesson_path.read_text(encoding='utf-8-sig', errors='replace')
        clean_html = re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.S | re.I)
        parts = re.split(r'(<section\b[^>]*class=[\'"][^\'"]*slide[^\'"]*[\'"][^>]*>)', clean_html)
        slides_info = []
        s_idx = 0
        for i in range(1, len(parts), 2):
            slide_html = parts[i+1] if i+1 < len(parts) else ''
            h = re.search(r'<h[1-4]\b[^>]*>(.*?)</h[1-4]>', slide_html, re.S | re.I)
            h_text = re.sub(r'<[^>]+>', '', h.group(1)).strip() if h else f'Раздел {s_idx + 1}'
            h_text = re.sub(r'\s+', ' ', h_text).strip()
            slides_info.append({'index': s_idx, 'title': h_text})
            s_idx += 1
        return slides_info
    except Exception:
        return []


def capture_lesson_slides(lesson_relative_path: str) -> dict[any, str]:
    """Capture and cache crisp screenshots of all slides in the lesson."""
    browser = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    if not os.path.exists(browser):
        browser = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    if not os.path.exists(browser):
        return {}

    lesson_path = (ROOT / lesson_relative_path.lstrip('/')).resolve()
    if not lesson_path.is_file():
        return {}

    h_hash = hashlib.md5(lesson_relative_path.encode('utf-8')).hexdigest()[:10]

    try:
        html = lesson_path.read_text(encoding='utf-8-sig', errors='replace')
        clean_html = re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.S | re.I)
        clean_html = re.sub(r'<link\b[^>]*http[^>]*>', '', clean_html, flags=re.I)
        base_dir = lesson_path.parent.as_posix()
        base_tag = f'<base href="file:///{base_dir}/">'
        clean_html = re.sub(r'(<head\b[^>]*>)', r'\1' + base_tag, clean_html, flags=re.I)
        clean_html = re.sub(r'(</head>)', '<style>* { animation: none !important; transition: none !important; }</style>\\1', clean_html, flags=re.I)

        parts = re.split(r'(<section\b[^>]*class=[\'"][^\'"]*slide[^\'"]*[\'"][^>]*>)', clean_html)
        total_slides = (len(parts) - 1) // 2
        if total_slides <= 0:
            return {}

        results = {}
        user_data = None

        for slide_idx in range(total_slides):
            cache_file = SCREENSHOTS_DIR / f'slide_{h_hash}_s{slide_idx}.png'
            if cache_file.is_file() and cache_file.stat().st_size > 1000:
                results[slide_idx] = str(cache_file)
                continue

            if user_data is None:
                user_data = tempfile.mkdtemp()

            new_parts = []
            s_idx = 0
            for part in parts:
                if re.match(r'<section\b[^>]*class=[\'"][^\'"]*slide', part):
                    p = re.sub(r'\bactive\b', '', part)
                    if s_idx == slide_idx:
                        p = p.replace('class="', 'class="active ').replace("class='", "class='active ")
                    s_idx += 1
                    new_parts.append(p)
                else:
                    new_parts.append(part)

            mod_html = ''.join(new_parts)
            temp_html = os.path.join(tempfile.gettempdir(), f'temp_{h_hash}_{slide_idx}.html')
            with open(temp_html, 'w', encoding='utf-8') as f:
                f.write(mod_html)

            cmd = [
                browser,
                '--headless=new',
                '--disable-gpu',
                '--no-sandbox',
                '--window-size=1200,750',
                f'--user-data-dir={user_data}',
                f'--screenshot={str(cache_file)}',
                'file:///' + temp_html.replace('\\', '/')
            ]
            try:
                subprocess.run(cmd, capture_output=True, timeout=12)
                if cache_file.is_file() and cache_file.stat().st_size > 1000:
                    results[slide_idx] = str(cache_file)
            except Exception:
                pass
            finally:
                if os.path.isfile(temp_html):
                    try:
                        os.unlink(temp_html)
                    except Exception:
                        pass

        # Compatibility aliases
        if 0 in results: results['intro'] = results[0]
        if 1 in results: results['theory'] = results[1]
        if min(4, total_slides - 1) in results: results['practice'] = results[min(4, total_slides - 1)]
        if (total_slides - 1) in results: results['summary'] = results[total_slides - 1]

        return results
    except Exception:
        return {}
    finally:
        if user_data and os.path.isdir(user_data):
            shutil.rmtree(user_data, ignore_errors=True)


def capture_lesson_screenshot(lesson_relative_path: str) -> str | None:
    """Fallback single screenshot capture."""
    slides = capture_lesson_slides(lesson_relative_path)
    return slides.get('theory') or slides.get('intro')


def sanitize_ksp_text(text: str) -> str:
    """Strictly scrub forbidden classroom equipment words (interactive whiteboards, laptops)."""
    if not text:
        return ''
    text = re.sub(r'\bинтерактивн\w*\s+доск\w*', 'платформу www.alasster.site', text, flags=re.I)
    text = re.sub(r'\bсмарт[- ]доск\w*', 'платформу www.alasster.site', text, flags=re.I)
    text = re.sub(r'\b(вызов|демонстрация)\s+к\s+доск[ее]\b', 'работа на платформе www.alasster.site', text, flags=re.I)
    text = re.sub(r'\bна\s+доске\b', 'на платформе www.alasster.site', text, flags=re.I)
    text = re.sub(r'\bэлектронн\w*\s+доск\w*', 'материалы платформы www.alasster.site', text, flags=re.I)
    text = re.sub(r'\bноутбук\w*', 'рабочих местах', text, flags=re.I)
    text = re.sub(r'\bноутбуках\b', 'рабочих местах', text, flags=re.I)
    return text


SEMANTIC_MARKERS = [
    r'Приветствие', r'Психологический настрой', r'Организационный момент',
    r'Тема урока', r'Тема', r'Цель нашего урока', r'Цель урока', r'Цели урока', r'Цель',
    r'Критерии успеха', r'Критерии оценивания', r'Критерии',
    r'Актуализация знаний', r'Актуализация', r'Интерактивная разминка', r'Разминка',
    r'Фронтальный опрос', r'Опрос',
    r'Вопрос учителя', r'Вопрос \d+', r'Вопрос',
    r'Ожидаемый ответ \d+', r'Ожидаемый ответ', r'Ожидаемые ответы',
    r'Подводка к новой теме', r'Подводка к теме', r'Подводка',
    r'Объяснение темы', r'Объяснение нового материала', r'Объяснение',
    r'Теоретический блок', r'Теория', r'Ключевые понятия', r'Ключевые тезисы',
    r'Терминология и правила', r'Терминология', r'Термины и определения', r'Термины', r'Термин', r'Определение',
    r'Разбор конкретного примера \d+', r'Разбор конкретного примера', r'Разбор примера \d+', r'Разбор примера',
    r'Пример \d+', r'Пример', r'Случай \d+',
    r'Контрольные вопросы', r'Контрольный вопрос', r'Проверка понимания',
    r'Инструктаж по технике безопасности', r'Инструктаж по ТБ', r'Инструктаж',
    r'Практическая работа', r'Постановка задачи',
    r'Задание 1\b[^\n:—–]*', r'Задание 2\b[^\n:—–]*', r'Задание 3\b[^\n:—–]*', r'Задание \d+', r'Задание',
    r'Условие задачи', r'Условие', r'Пошаговый алгоритм', r'Алгоритм решения', r'Алгоритм',
    r'Решение и ответ', r'Решение', r'Правильный ответ', r'Ответ для учителя', r'Ответ',
    r'Дескриптор', r'Дескрипторы',
    r'Подведение итогов урока', r'Подведение итогов', r'Итоги урока', r'Итоги',
    r'Обобщение темы', r'Обобщение',
    r'Рефлексия', r'Самооценивание', r'Взаимооценивание',
    r'Оценивание', r'Формативное оценивание', r'Выставление баллов ФО', r'Баллы ФО',
    r'Домашнее задание', r'Инструктаж по ДЗ', r'Инструктаж по домашнему заданию', r'ДЗ'
]

MARKER_SPLIT_REGEX = re.compile(
    r'(?:(?<=[.!?])|(?<=[.!?]["\'»”]))\s+(?=(?:\*\*)?(?:' + '|'.join(SEMANTIC_MARKERS) + r')(?:\*\*)?\s*[:—–-])',
    re.I
)

LABEL_MATCH_REGEX = re.compile(
    r'^(\s*(?:[•\-*]|\d+\.|\d+\))?\s*(?:\*{1,2})?[А-ЯЁ][A-Za-zА-Яа-яЁё0-9—–\s().,/«»"\'\-]{1,60}?\s*[:—–-](?:\*{1,2})?)\s*(.*)$',
    re.S
)


def split_into_logical_paragraphs(raw_text: str) -> list[str]:
    """Break a monotonous block of text into distinct, logical paragraphs."""
    raw_text = sanitize_ksp_text(str(raw_text or '').strip())
    if not raw_text:
        return []

    raw_text = raw_text.replace('\r\n', '\n').replace('\r', '\n')
    raw_lines = [l.strip() for l in re.split(r'\n+', raw_text) if l.strip()]

    paragraphs = []
    for line in raw_lines:
        sub_parts = MARKER_SPLIT_REGEX.split(line)
        for part in sub_parts:
            part = part.strip()
            if part:
                paragraphs.append(part)

    return paragraphs


def set_cell_formatted(cell, text: str, bold: bool = False, italic: bool = False,
                       font_size: Pt = FONT_SIZE, font_name: str = FONT_NAME,
                       align=WD_ALIGN_PARAGRAPH.LEFT):
    """
    Format cell content with distinct paragraphs, empty vertical space separation (space_after = Pt(5)),
    bold semantic prefixes, and clean alignment.
    Strictly removes all w:textDirection from cell to prevent rotated text.
    """
    cell.text = ''
    for td in cell._tc.xpath('.//*[local-name()="textDirection"]'):
        td.getparent().remove(td)

    paragraphs = split_into_logical_paragraphs(text)
    if not paragraphs:
        p = cell.paragraphs[0]
        p.text = ''
        return

    for i, para_text in enumerate(paragraphs):
        p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        p.text = ''
        for r in list(p.runs):
            p._p.remove(r._r)
        p.alignment = align
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(7)  # Distinct blank space between paragraphs!
        p.paragraph_format.line_spacing = 1.15

        para_clean = para_text.strip()
        m = LABEL_MATCH_REGEX.match(para_clean)
        if m:
            label = m.group(1).replace('*', '').strip()
            rest = m.group(2).replace('*', '').strip()

            r_lbl = p.add_run(label)
            r_lbl.bold = True
            r_lbl.italic = italic
            r_lbl.font.name = font_name
            r_lbl.font.size = font_size

            if rest:
                r_rest = p.add_run(' ' + rest)
                r_rest.bold = bold
                r_rest.italic = italic
                r_rest.font.name = font_name
                r_rest.font.size = font_size
        else:
            clean_text = para_clean.replace('*', '')
            r = p.add_run(clean_text)
            r.bold = bold
            r.italic = italic
            r.font.name = font_name
            r.font.size = font_size


def set_cell_text(cell, text: str, bold: bool = False, italic: bool = False,
                  font_size: Pt = FONT_SIZE, font_name: str = FONT_NAME):
    """Backward compatible wrapper using formatted layout."""
    set_cell_formatted(cell, text, bold=bold, italic=italic, font_size=font_size, font_name=font_name)



def get_weekly_quote(date_str: str = '', lesson_num: str | int = 1) -> dict:
    """Reads official weekly quote from Файлы/Цитаты.csv based on lesson date or week card."""
    csv_path = ROOT / 'Файлы' / 'Цитаты.csv'
    if not csv_path.is_file():
        return {
            'kz': '«Білекті бірді жығар, білімді мыңды жығар.»',
            'ru': '«Сильный одолеет одного, знающий - тысячу.»',
            'card': '2'
        }

    rows = []
    try:
        import csv
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            for r in csv.DictReader(f, delimiter=';'):
                rows.append(r)
    except Exception:
        pass

    if not rows:
        return {
            'kz': '«Білекті бірді жығар, білімді мыңды жығар.»',
            'ru': '«Сильный одолеет одного, знающий - тысячу.»',
            'card': '2'
        }

    # 1. Exact match on 'Дата начала'
    clean_date = (date_str or '').strip()
    if clean_date:
        for r in rows:
            if r.get('Дата начала', '').strip() == clean_date:
                return {
                    'kz': r.get('Цитата (казахский)', '').strip(),
                    'ru': r.get('Цитата (русский)', '').strip(),
                    'card': r.get('Номер карточки', '').strip()
                }

        # 2. Match date within the Monday-to-Sunday week
        try:
            from datetime import datetime
            dt = datetime.strptime(clean_date, '%d.%m.%Y')
            for i, r in enumerate(rows):
                r_dt = datetime.strptime(r.get('Дата начала', '').strip(), '%d.%m.%Y')
                next_dt = datetime.strptime(rows[i+1].get('Дата начала', '').strip(), '%d.%m.%Y') if i+1 < len(rows) else None
                if next_dt:
                    if r_dt <= dt < next_dt:
                        return {
                            'kz': r.get('Цитата (казахский)', '').strip(),
                            'ru': r.get('Цитата (русский)', '').strip(),
                            'card': r.get('Номер карточки', '').strip()
                        }
                else:
                    if dt >= r_dt:
                        return {
                            'kz': r.get('Цитата (казахский)', '').strip(),
                            'ru': r.get('Цитата (русский)', '').strip(),
                            'card': r.get('Номер карточки', '').strip()
                        }
        except Exception:
            pass

    # 3. Match by lesson number in quarter 1 (Lesson 1 -> Card 2, etc.)
    try:
        num = int(str(lesson_num).strip())
        target_card = num + 1
        for r in rows:
            if str(r.get('Номер карточки', '')).strip() == str(target_card):
                return {
                    'kz': r.get('Цитата (казахский)', '').strip(),
                    'ru': r.get('Цитата (русский)', '').strip(),
                    'card': str(target_card)
                }
    except Exception:
        pass

    r = rows[1] if len(rows) > 1 else rows[0]
    return {
        'kz': r.get('Цитата (казахский)', '').strip(),
        'ru': r.get('Цитата (русский)', '').strip(),
        'card': r.get('Номер карточки', '2')
    }


def format_values_block(raw_values: str, lesson_title: str, date_str: str = '', lesson_num: str = '') -> str:
    """Format Page 1 values row strictly using official quote from Файлы/Цитаты.csv."""
    quote_info = get_weekly_quote(date_str, lesson_num)
    quote_kz = quote_info['kz']
    quote_ru = quote_info['ru']
    quote_display = f"{quote_kz} ({quote_ru})"

    base_values = (
        "Воспитание в рамках Единой программы «Біртұтас тәрбие» и концепции «Адал азамат»: "
        "честность, справедливость, добросовестный труд, академическая честность, высокая ответственность за цифровые решения."
    )

    connection = (
        f"Тема урока «{lesson_title}» прямо связана со смыслом цитаты недели {quote_kz} ({quote_ru}): "
        f"учащиеся осознают личную ответственность за честность, точность и безопасность цифровых решений, "
        f"развивая практические навыки добросовестного и созидательного труда в цифровой среде."
    )

    # Check if raw_values from Gemini already contains the correct quote and linkage
    raw = (raw_values or '').strip()
    if (quote_kz in raw or quote_ru in raw) and '**Цитата недели:**' in raw and '**Связь с темой урока:**' in raw:
        return raw

    return f"**Цитата недели:** {quote_display}\n\n**Привитие ценностей:** {base_values}\n\n**Связь с темой урока:** {connection}"


def enrich_teacher_actions(text: str, stage_idx: int, lesson_title: str, date_str: str = '', lesson_num: str = '') -> str:
    """Ensure teacher actions in stages contain 1-2 sentences tying back to official Quote of the week."""
    if not text:
        return text

    quote_info = get_weekly_quote(date_str, lesson_num)
    quote_kz = quote_info['kz']
    quote_ru = quote_info['ru']

    if stage_idx == 0:
        if not re.search(r'цитат\w*\s+недел', text, re.I):
            sentence = f"\n\n**Связь с цитатой недели:** Учитель напоминает классу мудрость недели: {quote_kz} ({quote_ru}), настраивая учащихся на добросовестный труд, взаимное уважение и осознанное погружение в тему «{lesson_title}»."
            return text + sentence
    elif stage_idx == 2:
        if not re.search(r'адал\s+азамат|ответственност', text, re.I):
            sentence = f"\n\n**Привитие ценностей («Адал азамат»):** Учитель подчеркивает моральную ответственность и добросовестность при освоении принципов темы «{lesson_title}»."
            return text + sentence
    elif stage_idx == 3:
        if not re.search(r'академическ\w*\s+честност|адал', text, re.I):
            sentence = "\n\n**Академическая честность:** Учитель напоминает о принципе честного гражданина («Адал азамат») при самостоятельном выполнении практических заданий на платформе www.alasster.site."
            return text + sentence
    elif stage_idx == 4:
        if not re.search(r'цитат\w*\s+недел|нравственн', text, re.I):
            sentence = f"\n\n**Нравственный вывод:** Учитель подводит итог урока с отсылкой к цитате недели: {quote_ru}. Настоящий успех и прочные знания достигаются только честным трудом."
            return text + sentence

    return text

def build_docx(template_path: Path | str, target_path: Path | str, source: dict, plan: dict):
    """
    Builds a finished, formatted KSP docx based on the school's template.
    1. Font size: 12pt Times New Roman everywhere.
    2. Table 1 ("Ход урока") starts strictly on Page 2.
    3. Normal horizontal text direction everywhere (all w:textDirection stripped).
    4. Paragraphs divided cleanly with space_after = Pt(5) and bold section headers.
    5. Section screenshots captured and embedded under student activities.
    6. Strictly removes any OOP / ZPR rows or mentions.
    """
    template_path = Path(template_path)
    target_path = Path(target_path)

    if not template_path.is_file():
        raise FileNotFoundError(f"Шаблон КСП не найден: {template_path}")

    doc = docx.Document(str(template_path))

    if len(doc.tables) < 2:
        raise ValueError("Шаблон КСП должен содержать минимум 2 таблицы: шапку и таблицу хода урока")

    # Clean any w:textDirection from ALL tables to avoid rotated text
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for td in cell._tc.xpath('.//*[local-name()="textDirection"]'):
                    td.getparent().remove(td)

    t0 = doc.tables[0]
    t1 = doc.tables[1]

    # 1. Remove all OOP / ZPR rows from Table 0
    for row in list(t0.rows):
        first_cell_text = row.cells[0].text if row.cells else ''
        if re.search(r'\bООП\b|\bЗПР\b|особым[и]? образовательн', first_cell_text, re.I):
            row._tr.getparent().remove(row._tr)

    # 2. Remove all OOP / ZPR rows from Table 1
    for row in list(t1.rows):
        first_cell_text = row.cells[0].text if row.cells else ''
        if re.search(r'\bООП\b|\bЗПР\b|особым[и]? образовательн', first_cell_text, re.I):
            row._tr.getparent().remove(row._tr)

    # 3. Ensure Table 1 ("Ход урока") starts strictly on Page 2
    body = doc._body._element
    try:
        t0_idx = body.index(t0._tbl)
        t1_idx = body.index(t1._tbl)
        between_p_elems = [body[i] for i in range(t0_idx + 1, t1_idx) if body[i].tag.endswith('p')]

        for p_elem in between_p_elems[1:]:
            body.remove(p_elem)

        if between_p_elems:
            break_p = [p for p in doc.paragraphs if p._p == between_p_elems[0]][0]
            break_p.text = ''
            break_p.paragraph_format.space_before = Pt(0)
            break_p.paragraph_format.space_after = Pt(0)
            break_p.paragraph_format.line_spacing = Pt(1)
            r = break_p.add_run()
            r.add_break(WD_BREAK.PAGE)
        else:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run()
            r.add_break(WD_BREAK.PAGE)
            t1._tbl.addprevious(p._p)
    except Exception:
        pass

    header = plan.get('header', {})

    class_label = source.get('class_name', '')
    if not class_label.endswith('ы') and not class_label.endswith('класс'):
        class_label += ' класс'

    theme_text = source.get('title', '')
    if source.get('number'):
        theme_text += f". Урок {source.get('number')}"

    goals_text = '\n'.join(source.get('goals', []))
    if not goals_text and header.get('curriculum_goal'):
        goals_text = header.get('curriculum_goal', '')

    meta_mapping = {
        'Раздел': source.get('section') or header.get('section', ''),
        'ФИО педагога': os.environ.get('KSP_TEACHER', 'Кадыржанов Ж.К.'),
        'Предмет': 'Информатика',
        'Дата': source.get('date') or header.get('date', '________________'),
        'Класс': class_label,
        'Тема урока': theme_text,
        'Цели обучения в соответствии с учебной программой': goals_text,
        'Цель урока': header.get('lesson_goals', ''),
        'Привитие ценностей': format_values_block(header.get('values', ''), source.get('title', ''), source.get('date', ''), source.get('number', '')),
        'Функциональная грамотность': header.get('functional_literacy', ''),
        'Искусственный интеллект': header.get('ai_tools', 'Chat gpt, google ai studio, claude, copilot, gemini')
    }

    # Populate Table 0 cells strictly in 12pt
    for row in t0.rows:
        if not row.cells:
            continue
        for p in row.cells[0].paragraphs:
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            for r in p.runs:
                r.font.name = FONT_NAME
                r.font.size = FONT_SIZE
                r.bold = True

        label = row.cells[0].text.strip()
        for k, v in meta_mapping.items():
            if k in label and len(row.cells) > 1:
                set_cell_formatted(row.cells[1], v, bold=False, font_size=FONT_SIZE)
                break

    # Format Table 1 header rows strictly in 12pt
    if len(t1.rows) > 0:
        for p in t1.rows[0].cells[0].paragraphs:
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            for r in p.runs:
                r.font.name = FONT_NAME
                r.font.size = FONT_SIZE
                r.bold = True

    if len(t1.rows) > 1:
        for cell in t1.rows[1].cells:
            for p in cell.paragraphs:
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.15
                for r in p.runs:
                    r.font.name = FONT_NAME
                    r.font.size = FONT_SIZE
                    r.bold = True

    # Capture screenshots of lesson sections for interactive stages
    slides_meta = get_lesson_slides_meta(source.get('key', ''))
    total_s = len(slides_meta)
    slide_shots = capture_lesson_slides(source.get('key', ''))

    if total_s >= 9:
        stage_slide_indices = {
            0: [0],          # 1 section: Введение
            1: [1],          # 1 section: Разминка / Что такое ИИ
            2: [2, 3],       # 2 sections: Этические вопросы, Сферы применения
            3: [4, 7],       # 2 sections: Интерактивный кейс, Практическая работа
            4: [6, 8]        # 2 sections: Мини-проверка, Итоги урока
        }
    elif total_s >= 7:
        stage_slide_indices = {
            0: [0],
            1: [1],
            2: [2, 3],
            3: [4, min(5, total_s - 2)],
            4: [total_s - 2, total_s - 1]
        }
    elif total_s >= 5:
        stage_slide_indices = {
            0: [0],
            1: [1],
            2: [2],
            3: [3],
            4: [4]
        }
    else:
        stage_slide_indices = {i: [min(i, max(0, total_s - 1))] for i in range(5)}

    # Populate Table 1 stages strictly in 12pt with formatted paragraphs and screenshots
    stages = plan.get('stages', [])
    for i, stage in enumerate(stages[:5]):
        row_idx = 2 + i
        if row_idx < len(t1.rows):
            r = t1.rows[row_idx]
            s_name = stage.get('stage_name', f"Этап {i+1}")
            set_cell_formatted(r.cells[0], s_name, bold=True, font_size=FONT_SIZE)

            # 1. Enriched teacher actions with Quote of the week & Values connections
            teacher_act = enrich_teacher_actions(stage.get('teacher_actions', ''), i, source.get('title', ''), source.get('date', ''), source.get('number', ''))
            set_cell_formatted(r.cells[1], teacher_act, font_size=FONT_SIZE)

            # 2. Student actions text
            set_cell_formatted(r.cells[2], stage.get('student_actions', ''), font_size=FONT_SIZE)

            # 3. Determine resources & attach matching screenshots
            stage_indices = stage_slide_indices.get(i, [])
            section_labels = []
            for s_idx in stage_indices:
                t = slides_meta[s_idx]['title'] if s_idx < len(slides_meta) else f"Раздел {s_idx+1}"
                section_labels.append(f"Раздел {s_idx+1} «{t}»")

            # Column 4: Assessment
            set_cell_formatted(r.cells[3], stage.get('assessment', ''), font_size=FONT_SIZE)

            # Column 5: Resources mentioning the exact sections
            raw_res = stage.get('resources', '').strip()
            if not raw_res or 'alasster.site' not in raw_res.lower() or not re.search(r'раздел|слайд', raw_res, re.I):
                res_text = f"Платформа www.alasster.site ({', '.join(section_labels)})"
            else:
                res_text = raw_res
            set_cell_formatted(r.cells[4], res_text, font_size=FONT_SIZE)

            # Column 3: Insert screenshots matching the sections in Resources!
            for s_idx in stage_indices:
                shot_file = slide_shots.get(s_idx)
                if shot_file and os.path.isfile(shot_file):
                    s_title = slides_meta[s_idx]['title'] if s_idx < len(slides_meta) else f"Раздел {s_idx+1}"

                    p_cap = r.cells[2].add_paragraph()
                    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    p_cap.paragraph_format.space_before = Pt(3)
                    p_cap.paragraph_format.space_after = Pt(1)
                    r_cap = p_cap.add_run(f"Скриншот платформы www.alasster.site: Раздел {s_idx+1} «{s_title}»")
                    r_cap.font.name = FONT_NAME
                    r_cap.font.size = Pt(9.5)
                    r_cap.font.italic = True

                    p_shot = r.cells[2].add_paragraph()
                    p_shot.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    p_shot.paragraph_format.space_before = Pt(1)
                    p_shot.paragraph_format.space_after = Pt(4)
                    r_shot = p_shot.add_run()
                    r_shot.add_picture(shot_file, width=Inches(2.1))

    # Build locally (never write temp/rename files inside Google Drive folder)
    local_dir = BASE / '.runtime' / 'ksp' / 'out'
    local_dir.mkdir(parents=True, exist_ok=True)
    local_file = local_dir / f"{hashlib.md5(str(target_path).encode('utf-8')).hexdigest()[:12]}.docx"
    doc.save(str(local_file))

    doc_check = docx.Document(str(local_file))
    full_text = ' '.join(c.text for t in doc_check.tables for r in t.rows for c in r.cells)
    if re.search(r'\bООП\b|\bЗПР\b|особым[и]? образовательн', full_text, re.I):
        local_file.unlink(missing_ok=True)
        raise ValueError('В сформированном документе обнаружены запрещенные упоминания ООП/ЗПР!')

    # Single copy into Google Drive (Drive for Desktop syncs it to the cloud)
    target_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(str(local_file), str(target_path))
    if not target_path.is_file() or target_path.stat().st_size != local_file.stat().st_size:
        raise ValueError('Не удалось сохранить КСП в папку Google Диска')
    local_file.unlink(missing_ok=True)

    # Immediately clean up all temporary screenshots and temp files now that they are embedded in docx
    cleanup_ksp_temp_files(slide_shots)

    return str(target_path)


def docx_to_html(doc_path: Path | str) -> str:
    """Converts the DOCX tables and paragraphs into high-fidelity HTML preview."""
    doc_path = Path(doc_path)
    if not doc_path.is_file():
        return "<p>Файл не найден</p>"

    doc = docx.Document(str(doc_path))
    html_parts = []

    # Extract images mapped by relationship ID for embedding
    images = {}
    for rel in doc.part.rels.values():
        if "image" in rel.target_ref:
            try:
                img_data = rel.target_part.blob
                b64 = base64.b64encode(img_data).decode('ascii')
                images[rel.rId] = f"data:image/png;base64,{b64}"
            except Exception:
                pass

    for table in doc.tables:
        html_parts.append('<table class="ksp-table">')
        for row in table.rows:
            html_parts.append('<tr>')
            for cell in row.cells:
                html_parts.append('<td>')
                blips = cell._tc.xpath('.//*[local-name()="blip"]')
                for p in cell.paragraphs:
                    p_text = p.text.strip()
                    if p_text:
                        p_html = re.sub(r'^(\s*(?:[•\-*]|\d+\.|\d+\))?\s*(?:\*{1,2})?[А-ЯЁ][A-Za-zА-Яа-яЁё0-9—–\s().,/«»"\'\-]{1,60}?\s*[:—–-](?:\*{1,2})?)\s*', r'<strong>\1 </strong>', p_text)
                        html_parts.append(f'<p>{p_html}</p>')
                for blip in blips:
                    embed_id = blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                    if embed_id and embed_id in images:
                        html_parts.append(f'<div class="ksp-img-box" style="text-align:center; margin:8px 0;"><img src="{images[embed_id]}" alt="Скриншот с www.alasster.site" style="max-width:280px; width:100%; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.15); border: 1px solid #cbd5e1;"></div>')
                html_parts.append('</td>')
            html_parts.append('</tr>')
        html_parts.append('</table>')

    return '\n'.join(html_parts)
