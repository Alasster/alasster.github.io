"""Robust, template-preserving DOCX builder for Kazakhstan KSP lesson plans using python-docx."""
from __future__ import annotations

import os
import re
from pathlib import Path
import docx
from docx.shared import Pt

NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'


def set_cell_text(cell, text: str, bold: bool = False, italic: bool = False,
                  font_size: Pt = Pt(9), font_name: str = 'Times New Roman'):
    """Format cell text cleanly preserving table styles."""
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


def build_docx(template_path: Path | str, target_path: Path | str, source: dict, plan: dict):
    """
    Builds a finished, formatted KSP docx based on the school's template.
    Strictly removes any OOP / ZPR rows or mentions.
    Preserves exact landscape layout, column widths, and cell borders.
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

    # Populate Table 0 cells
    for row in t0.rows:
        if not row.cells:
            continue
        label = row.cells[0].text.strip()
        for k, v in meta_mapping.items():
            if k in label and len(row.cells) > 1:
                set_cell_text(row.cells[1], v)
                break

    # Populate Table 1 stages
    stages = plan.get('stages', [])
    # In Table 1:
    # Row 0: 'Ход урока' (spanning all columns)
    # Row 1: ['Этапы урока', 'Деятельность учителя', 'Деятельность обучающихся', 'Оценивание', 'Ресурсы']
    # Rows 2..6: Stages 1 through 5
    for i, stage in enumerate(stages[:5]):
        row_idx = 2 + i
        if row_idx < len(t1.rows):
            r = t1.rows[row_idx]
            s_name = stage.get('stage_name', f"Этап {i+1}")
            set_cell_text(r.cells[0], s_name, bold=True)
            set_cell_text(r.cells[1], stage.get('teacher_actions', ''))
            set_cell_text(r.cells[2], stage.get('student_actions', ''))
            set_cell_text(r.cells[3], stage.get('assessment', ''))
            set_cell_text(r.cells[4], stage.get('resources', ''))

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
