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


def capture_lesson_slides(lesson_relative_path: str) -> dict[str, str]:
    """Capture and cache crisp screenshots of key lesson sections: intro, theory, practice, summary."""
    browser = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    if not os.path.exists(browser):
        browser = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    if not os.path.exists(browser):
        return {}

    lesson_path = (ROOT / lesson_relative_path.lstrip('/')).resolve()
    if not lesson_path.is_file():
        return {}

    h_hash = hashlib.md5(lesson_relative_path.encode('utf-8')).hexdigest()[:10]
    stage_keys = ['intro', 'theory', 'practice', 'summary']

    # Check if all cached screenshots already exist on disk
    all_cached = True
    cached_results = {}
    for sk in stage_keys:
        cf = SCREENSHOTS_DIR / f'slide_{h_hash}_{sk}.png'
        if cf.is_file() and cf.stat().st_size > 1000:
            cached_results[sk] = str(cf)
        else:
            all_cached = False

    if all_cached:
        return cached_results

    try:
        html = lesson_path.read_text(encoding='utf-8-sig', errors='replace')
        clean_html = re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.S | re.I)
        clean_html = re.sub(r'<link\b[^>]*http[^>]*>', '', clean_html, flags=re.I)
        base_dir = lesson_path.parent.as_posix()
        base_tag = f'<base href="file:///{base_dir}/">'
        clean_html = re.sub(r'(<head\b[^>]*>)', r'\1' + base_tag, clean_html, flags=re.I)
        clean_html = re.sub(r'(</head>)', '<style>* { animation: none !important; transition: none !important; }</style>\\1', clean_html, flags=re.I)

        slide_matches = list(re.finditer(r'<section\b[^>]*class=[\'"][^\'"]*slide[^\'"]*[\'"][^>]*>', clean_html, re.I))
        total_slides = len(slide_matches)
        if total_slides == 0:
            return {}

        slide_map = {
            'intro': 0,
            'theory': min(1 if total_slides > 1 else 0, total_slides - 1),
            'practice': min(4 if total_slides > 4 else max(1, total_slides // 2), total_slides - 1),
            'summary': max(0, total_slides - 2 if total_slides > 2 else total_slides - 1)
        }

        results = {}
        user_data = tempfile.mkdtemp()

        for stage_key, target_idx in slide_map.items():
            cache_file = SCREENSHOTS_DIR / f'slide_{h_hash}_{stage_key}.png'
            if cache_file.is_file() and cache_file.stat().st_size > 1000:
                results[stage_key] = str(cache_file)
                continue

            parts = re.split(r'(<section\b[^>]*class=[\'"][^\'"]*slide[^\'"]*[\'"][^>]*>)', clean_html)
            new_parts = []
            s_idx = 0
            for part in parts:
                if re.match(r'<section\b[^>]*class=[\'"][^\'"]*slide', part):
                    p = re.sub(r'\bactive\b', '', part)
                    if s_idx == target_idx:
                        p = p.replace('class="', 'class="active ').replace("class='", "class='active ")
                    s_idx += 1
                    new_parts.append(p)
                else:
                    new_parts.append(part)

            mod_html = ''.join(new_parts)
            temp_html = os.path.join(tempfile.gettempdir(), f'ksp_slide_{os.getpid()}_{h_hash}_{stage_key}.html')
            with open(temp_html, 'w', encoding='utf-8') as f:
                f.write(mod_html)
            out_png = str(cache_file)

            cmd = [
                browser,
                '--headless=new',
                '--disable-gpu',
                '--no-sandbox',
                '--window-size=1200,750',
                f'--user-data-dir={user_data}',
                f'--screenshot={out_png}',
                'file:///' + temp_html.replace('\\', '/')
            ]
            subprocess.run(cmd, capture_output=True, timeout=10)
            if os.path.isfile(out_png) and os.path.getsize(out_png) > 1000:
                results[stage_key] = out_png

        return results
    except Exception:
        return {}


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
        'Привитие ценностей': header.get('values', ''),
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
    slide_shots = capture_lesson_slides(source.get('key', ''))

    stage_shot_map = {
        0: slide_shots.get('intro'),     # Stage 1: Орг. момент (Титульный слайд темы на www.alasster.site)
        1: slide_shots.get('intro') or slide_shots.get('theory'), # Stage 2: Актуализация
        2: slide_shots.get('theory'),    # Stage 3: Объяснение (Теоретический блок)
        3: slide_shots.get('practice'),  # Stage 4: Практика (Интерактивная лаборатория)
        4: slide_shots.get('summary')    # Stage 5: Итоги (Итоговый тест / рефлексия)
    }

    # Populate Table 1 stages strictly in 12pt with formatted paragraphs and screenshots
    stages = plan.get('stages', [])
    for i, stage in enumerate(stages[:5]):
        row_idx = 2 + i
        if row_idx < len(t1.rows):
            r = t1.rows[row_idx]
            s_name = stage.get('stage_name', f"Этап {i+1}")
            set_cell_formatted(r.cells[0], s_name, bold=True, font_size=FONT_SIZE)
            set_cell_formatted(r.cells[1], stage.get('teacher_actions', ''), font_size=FONT_SIZE)
            set_cell_formatted(r.cells[2], stage.get('student_actions', ''), font_size=FONT_SIZE)

            # Insert screenshot in «Деятельность обучающихся» in a neat, small size (Inches(2.1))
            shot_file = stage_shot_map.get(i)
            if shot_file and os.path.isfile(shot_file):
                p_shot = r.cells[2].add_paragraph()
                p_shot.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_shot.paragraph_format.space_before = Pt(4)
                p_shot.paragraph_format.space_after = Pt(4)
                r_shot = p_shot.add_run()
                r_shot.add_picture(shot_file, width=Inches(2.1))

            set_cell_formatted(r.cells[3], stage.get('assessment', ''), font_size=FONT_SIZE)
            set_cell_formatted(r.cells[4], stage.get('resources', ''), font_size=FONT_SIZE)

    target_path.parent.mkdir(parents=True, exist_ok=True)
    temp_target = target_path.with_suffix('.tmp.docx')
    doc.save(str(temp_target))

    # Strict verification before atomic publish
    doc_check = docx.Document(str(temp_target))
    full_text = ' '.join(c.text for t in doc_check.tables for r in t.rows for c in r.cells)
    if re.search(r'\bООП\b|\bЗПР\b|особым[и]? образовательн', full_text, re.I):
        if temp_target.exists():
            temp_target.unlink()
        raise ValueError('В сформированном документе обнаружены запрещенные упоминания ООП/ЗПР!')

    if target_path.exists():
        try:
            target_path.unlink()
        except Exception:
            pass
    temp_target.replace(target_path)
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
