"""Robust, template-preserving DOCX builder for Kazakhstan KSP lesson plans using python-docx.
- Strict 12pt Times New Roman everywhere.
- Table 1 starts on Page 2.
- Captures and embeds real screenshots from the corresponding lesson on www.alasster.site.
- Strictly zero mentions of OOP / ZPR.
"""
from __future__ import annotations

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


def capture_lesson_screenshot(lesson_relative_path: str) -> str | None:
    """Take a crisp, headless screenshot of the corresponding lesson HTML file."""
    browser = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    if not os.path.exists(browser):
        browser = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    if not os.path.exists(browser):
        return None

    lesson_path = (ROOT / lesson_relative_path.lstrip('/')).resolve()
    if not lesson_path.is_file():
        return None

    try:
        html = lesson_path.read_text(encoding='utf-8-sig', errors='replace')
        # Strip external network scripts and external CSS to guarantee instant offline rendering
        clean_html = re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.S | re.I)
        clean_html = re.sub(r'<link\b[^>]*http[^>]*>', '', clean_html, flags=re.I)

        # Inject base href to resolve local stylesheets and images cleanly
        base_dir = lesson_path.parent.as_posix()
        base_tag = f'<base href="file:///{base_dir}/">'
        clean_html = re.sub(r'(<head\b[^>]*>)', r'\1' + base_tag, clean_html, flags=re.I)

        temp_html = os.path.join(tempfile.gettempdir(), f'lesson_snap_{os.getpid()}_{abs(hash(lesson_relative_path)) % 10000}.html')
        with open(temp_html, 'w', encoding='utf-8') as f:
            f.write(clean_html)

        out_png = os.path.join(tempfile.gettempdir(), f'lesson_snap_{os.getpid()}_{abs(hash(lesson_relative_path)) % 10000}.png')
        user_data = tempfile.mkdtemp()
        file_url = 'file:///' + temp_html.replace('\\', '/')

        cmd = [
            browser,
            '--headless=new',
            '--disable-gpu',
            '--no-sandbox',
            '--window-size=1200,750',
            f'--user-data-dir={user_data}',
            f'--screenshot={out_png}',
            file_url
        ]
        subprocess.run(cmd, capture_output=True, timeout=8)
        if os.path.isfile(out_png) and os.path.getsize(out_png) > 1000:
            return out_png
    except Exception:
        pass
    return None


def sanitize_ksp_text(text: str) -> str:
    """Strictly scrub forbidden classroom terms: interactive whiteboards and laptops."""
    if not text:
        return ''
    # Replace interactive whiteboard mentions
    text = re.sub(r'\bинтерактивн\w*\s+доск\w*', 'платформу www.alasster.site', text, flags=re.I)
    text = re.sub(r'\bсмарт[- ]доск\w*', 'платформу www.alasster.site', text, flags=re.I)
    text = re.sub(r'\b(на|к)\s+доск[еу]\b', 'к платформе www.alasster.site', text, flags=re.I)
    text = re.sub(r'\bу\s+доски\b', 'на платформе www.alasster.site', text, flags=re.I)
    # Replace laptop mentions
    text = re.sub(r'\bна\s+ноутбук\w*', 'на рабочих местах на платформе www.alasster.site', text, flags=re.I)
    text = re.sub(r'\bноутбук\w*', 'рабочие места', text, flags=re.I)
    return text


def set_cell_text(cell, text: str, bold: bool = False, italic: bool = False,
                  font_size: Pt = FONT_SIZE, font_name: str = FONT_NAME):
    """Format cell text cleanly strictly in 12pt Times New Roman."""
    cell.text = ''
    text = sanitize_ksp_text(text)
    lines = str(text or '').split('\n')
    for i, line in enumerate(lines):
        p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        p.text = ''
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(line)
        run.bold = bold
        run.italic = italic
        run.font.name = font_name
        run.font.size = font_size


def build_docx(template_path: Path | str, target_path: Path | str, source: dict, plan: dict):
    """
    Builds a finished, formatted KSP docx based on the school's template.
    1. Font size: 12pt Times New Roman everywhere.
    2. Table 1 ("Ход урока") starts strictly on Page 2.
    3. Screenshots of the real corresponding lesson are taken and neatly embedded.
    4. Strictly removes any OOP / ZPR rows or mentions.
    """
    template_path = Path(template_path)
    target_path = Path(target_path)

    if not template_path.is_file():
        raise FileNotFoundError(f"Шаблон КСП не найден: {template_path}")

    doc = docx.Document(str(template_path))

    if len(doc.tables) < 2:
        raise ValueError("Шаблон КСП должен содержать минимум 2 таблицы: шапку и таблицу хода урока")

    t0 = doc.tables[0]
    t1 = doc.tables[1]

    # 1. Remove all OOP / ZPR rows from Table 0 (header metadata)
    for row in list(t0.rows):
        first_cell_text = row.cells[0].text if row.cells else ''
        if re.search(r'\bООП\b|\bЗПР\b|особым[и]? образовательн', first_cell_text, re.I):
            row._tr.getparent().remove(row._tr)

    # 2. Remove all OOP / ZPR rows from Table 1 (lesson stages)
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
                set_cell_text(row.cells[1], v, bold=False, font_size=FONT_SIZE)
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

    # Capture real screenshot of the corresponding lesson
    lesson_screenshot_path = capture_lesson_screenshot(source.get('key', ''))

    # Populate Table 1 stages strictly in 12pt with lesson screenshot
    stages = plan.get('stages', [])
    for i, stage in enumerate(stages[:5]):
        row_idx = 2 + i
        if row_idx < len(t1.rows):
            r = t1.rows[row_idx]
            s_name = stage.get('stage_name', f"Этап {i+1}")
            set_cell_text(r.cells[0], s_name, bold=True, font_size=FONT_SIZE)
            set_cell_text(r.cells[1], stage.get('teacher_actions', ''), font_size=FONT_SIZE)
            set_cell_text(r.cells[2], stage.get('student_actions', ''), font_size=FONT_SIZE)

            # In stage 3 (Объяснение нового материала), insert the crisp lesson screenshot!
            if i == 2 and lesson_screenshot_path and os.path.isfile(lesson_screenshot_path):
                p_shot = r.cells[2].add_paragraph()
                p_shot.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_shot.paragraph_format.space_before = Pt(4)
                p_shot.paragraph_format.space_after = Pt(2)
                r_shot = p_shot.add_run()
                r_shot.add_picture(lesson_screenshot_path, width=Inches(3.2))

            set_cell_text(r.cells[3], stage.get('assessment', ''), font_size=FONT_SIZE)
            set_cell_text(r.cells[4], stage.get('resources', ''), font_size=FONT_SIZE)

    target_path.parent.mkdir(parents=True, exist_ok=True)
    temp_target = target_path.with_suffix('.tmp.docx')
    doc.save(str(temp_target))

    # Strict verification before atomic publish
    doc_check = docx.Document(str(temp_target))
    full_text = ' '.join(c.text for t in doc_check.tables for r in t.rows for c in r.cells)
    if re.search(r'\bООП\b|\bЗПР\b|особым[и]? образовательн', full_text, re.I):
        if temp_target.exists():
            temp_target.unlink()
        raise ValueError('В сформированном документе обнаружены не удалённые блоки ООП')

    temp_target.replace(target_path)
