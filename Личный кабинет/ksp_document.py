"""Robust, template-preserving DOCX builder for Kazakhstan KSP lesson plans using python-docx.
Strictly 14pt Times New Roman, Table 1 starts on Page 2, preserves neat screenshots.
"""
from __future__ import annotations

import os
import re
from copy import deepcopy
from pathlib import Path
import docx
from docx.shared import Pt
from docx.enum.text import WD_BREAK

FONT_SIZE = Pt(14)
FONT_NAME = 'Times New Roman'


def set_cell_text(cell, text: str, bold: bool = False, italic: bool = False,
                  font_size: Pt = FONT_SIZE, font_name: str = FONT_NAME,
                  preserve_drawings: bool = False):
    """Format cell text cleanly preserving 14pt Times New Roman and optional screenshots."""
    drawing_paragraphs = []
    if preserve_drawings:
        for p in cell.paragraphs:
            if p._p.xpath('.//w:drawing'):
                drawing_paragraphs.append(deepcopy(p._p))

    cell.text = ''
    lines = str(text or '').split('\n')
    for i, line in enumerate(lines):
        p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(line)
        run.bold = bold
        run.italic = italic
        run.font.name = font_name
        run.font.size = font_size

    if preserve_drawings:
        for dp in drawing_paragraphs:
            cell._tc.append(dp)


def build_docx(template_path: Path | str, target_path: Path | str, source: dict, plan: dict):
    """
    Builds a finished, formatted KSP docx based on the school's template.
    1. Font size: 14pt Times New Roman everywhere.
    2. Table 1 ("Ход урока") starts strictly on Page 2.
    3. Screenshots/drawings in lesson stages are preserved and formatted neatly.
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

        # Remove extra empty paragraphs between tables
        for p_elem in between_p_elems[1:]:
            body.remove(p_elem)

        # In the first paragraph between Table 0 and Table 1, insert page break
        if between_p_elems:
            break_p = [p for p in doc.paragraphs if p._p == between_p_elems[0]][0]
            break_p.text = ''
            break_p.paragraph_format.space_before = Pt(0)
            break_p.paragraph_format.space_after = Pt(0)
            break_p.paragraph_format.line_spacing = Pt(1)
            r = break_p.add_run()
            r.add_break(WD_BREAK.PAGE)
        else:
            # If no paragraph existed between tables, insert one before t1
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

    # Populate Table 0 cells with 14pt font
    for row in t0.rows:
        if not row.cells:
            continue
        # Set label in 14pt bold
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

    # Format Table 1 header rows with 14pt
    if len(t1.rows) > 0:
        # Row 0: "Ход урока" banner
        for p in t1.rows[0].cells[0].paragraphs:
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            for r in p.runs:
                r.font.name = FONT_NAME
                r.font.size = FONT_SIZE
                r.bold = True

    if len(t1.rows) > 1:
        # Row 1: Columns ["Этапы урока", "Деятельность учителя", ...]
        for cell in t1.rows[1].cells:
            for p in cell.paragraphs:
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.15
                for r in p.runs:
                    r.font.name = FONT_NAME
                    r.font.size = FONT_SIZE
                    r.bold = True

    # Populate Table 1 stages with 14pt font & preserved screenshots
    stages = plan.get('stages', [])
    for i, stage in enumerate(stages[:5]):
        row_idx = 2 + i
        if row_idx < len(t1.rows):
            r = t1.rows[row_idx]
            s_name = stage.get('stage_name', f"Этап {i+1}")
            set_cell_text(r.cells[0], s_name, bold=True, font_size=FONT_SIZE)
            set_cell_text(r.cells[1], stage.get('teacher_actions', ''), font_size=FONT_SIZE)
            # In cell 2 (Деятельность обучающихся), preserve screenshots!
            set_cell_text(r.cells[2], stage.get('student_actions', ''), font_size=FONT_SIZE, preserve_drawings=True)
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
