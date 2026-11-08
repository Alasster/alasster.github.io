import os, re, json
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent

Q2_FILES = {
    '9 класс': ROOT / 'скрипты' / 'q2-data-9.js',
    '10 ЕМН': ROOT / 'скрипты' / 'q2-data-10emn.js',
    '10 ОГН': ROOT / 'скрипты' / 'q2-data-10ogn.js',
    '11 класс': ROOT / 'скрипты' / 'q2-data-11.js'
}

ID_PREFIX = {
    '9 класс': '9-q2-',
    '10 ЕМН': '10emn-q2-',
    '10 ОГН': '10ogn-q2-',
    '11 класс': '11-q2-'
}


def _clean_str(val: str) -> str:
    if not val:
        return ''
    val = re.sub(r'<[^>]+>', ' ', val)
    return re.sub(r'\s+', ' ', val).strip()


def extract_q2_lesson_raw_js(class_name: str, lesson_num: int | str) -> str:
    js_path = Q2_FILES.get(class_name)
    if not js_path or not js_path.is_file():
        return ''

    prefix = ID_PREFIX.get(class_name, '')
    lid = f'{prefix}{int(lesson_num)}'
    content = js_path.read_text(encoding='utf-8')

    pattern = rf"Q2\.add\(\s*['\"]{re.escape(lid)}['\"]\s*,\s*\{{"
    m = re.search(pattern, content)
    if not m:
        return ''

    start_pos = m.end() - 1
    depth = 0
    in_str = None
    esc = False
    end_pos = start_pos
    for i in range(start_pos, len(content)):
        ch = content[i]
        if in_str:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == in_str:
                in_str = None
        else:
            if ch in ("'", '"', '`'):
                in_str = ch
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    end_pos = i + 1
                    break

    return content[start_pos:end_pos]


def get_q2_slides_meta(class_name: str, lesson_num: int | str) -> list[dict]:
    raw_js = extract_q2_lesson_raw_js(class_name, lesson_num)
    if not raw_js:
        return []

    # Find each slide object inside slides: [...]
    slides_match = re.search(r"slides:\s*\[", raw_js)
    if not slides_match:
        return []

    slides_info = []
    # Match slide kind and title/eyebrow
    slide_chunks = re.split(r"(?:^|\n)\s*\{\s*k:\s*['\"]", raw_js)
    s_idx = 0
    for chunk in slide_chunks[1:]:
        kind_m = re.match(r"^(\w+)", chunk)
        kind = kind_m.group(1) if kind_m else 'slide'
        title_m = re.search(r"title:\s*(['\"`])((?:\\.|(?!\1).)*)\1", chunk, re.S)
        eyebrow_m = re.search(r"eyebrow:\s*(['\"`])((?:\\.|(?!\1).)*)\1", chunk, re.S)

        title = _clean_str(title_m.group(2)) if title_m else ''
        eyebrow = _clean_str(eyebrow_m.group(2)) if eyebrow_m else ''

        if kind == 'hero':
            label = f"Введение: {title}" if title else "Введение"
        elif kind == 'review':
            label = "Повторение и разминка"
        elif kind == 'practice':
            label = f"Практика: {title}" if title else "Практическая работа"
        elif kind == 'quiz':
            label = "Проверка знаний"
        elif kind == 'summary':
            label = "Итоги урока"
        else:
            label = title or eyebrow or f"Раздел {s_idx + 1}"

        slides_info.append({'index': s_idx, 'title': label, 'kind': kind})
        s_idx += 1

    return slides_info


def get_q2_lesson_text(class_name: str, lesson_num: int | str) -> dict:
    raw_js = extract_q2_lesson_raw_js(class_name, lesson_num)
    if not raw_js:
        return {}

    t_match = re.search(r"title:\s*(['\"`])((?:\\.|(?!\1).)*)\1", raw_js, re.S)
    title = _clean_str(t_match.group(2)) if t_match else ''

    g_match = re.search(r"goal:\s*(['\"`])((?:\\.|(?!\1).)*)\1", raw_js, re.S)
    gc_match = re.search(r"goalCode:\s*(['\"`])((?:\\.|(?!\1).)*)\1", raw_js, re.S)
    goal = _clean_str(g_match.group(2)) if g_match else ''
    goal_code = _clean_str(gc_match.group(2)) if gc_match else ''

    full_goal = f"{goal_code} {goal}".strip() if goal else ''

    lines = []
    lines.append(f"ТЕМА УРОКА НА ПЛАТФОРМЕ WWW.ALASSTER.SITE: «{title}»")
    if full_goal:
        lines.append(f"ЦЕЛЬ ОБУЧЕНИЯ ПО ПРОГРАММЕ: {full_goal}")

    # 1. Review (Разминка)
    lines.append("\n=======================================================")
    lines.append("РАЗДЕЛ: АКТУАЛИЗАЦИЯ И РАЗМИНКА (ВОПРОСЫ С ПЛАТФОРМЫ)")
    lines.append("=======================================================")
    rev_matches = re.finditer(
        r"q:\s*['\"`](.*?)['\"`].*?options:\s*\[(.*?)\]\s*,\s*answer:\s*(\d+)(?:,\s*explain:\s*['\"`](.*?)['\"`])?",
        raw_js, re.S
    )
    for q_idx, qm in enumerate(rev_matches, 1):
        q_text = _clean_str(qm.group(1))
        opts_raw = qm.group(2)
        opts = [_clean_str(re.sub(r"^['\"`]|['\"`]$", "", o.strip())) for o in re.split(r",\s*(?=['\"`])", opts_raw)]
        ans_idx = int(qm.group(3))
        ans_text = opts[ans_idx] if ans_idx < len(opts) else str(ans_idx)
        explain = _clean_str(qm.group(4) or "")
        lines.append(f"Вопрос {q_idx}: {q_text}")
        lines.append(f"Варианты: {', '.join(opts)}")
        lines.append(f"Правильный ответ: {ans_text}")
        if explain:
            lines.append(f"Пояснение учителя: {explain}")
        lines.append("")

    # 2. Theory (Теория)
    lines.append("\n=======================================================")
    lines.append("РАЗДЕЛ: ОБЪЯСНЕНИЕ НОВОГО МАТЕРИАЛА (ТЕОРИЯ С ПЛАТФОРМЫ)")
    lines.append("=======================================================")
    for cm in re.finditer(r"title:\s*(['\"`])((?:\\.|(?!\1).)*)\1.*?lead:\s*(['\"`])((?:\\.|(?!\3).)*)\3", raw_js, re.S):
        c_title = _clean_str(cm.group(2))
        c_lead = _clean_str(cm.group(4))
        if c_title and c_title != title:
            lines.append(f"\nТеоретический блок: {c_title}\nГлавная мысль: {c_lead}")

    for sm in re.finditer(r"title:\s*(['\"`])((?:\\.|(?!\1).)*)\1\s*,\s*text:\s*(['\"`])((?:\\.|(?!\3).)*)\3", raw_js):
        t_sub = _clean_str(sm.group(2))
        tx = _clean_str(sm.group(4))
        if t_sub and tx:
            lines.append(f"  • {t_sub}: {tx}")

    for com in re.finditer(r"t:\s*['\"]callout['\"].*?title:\s*(['\"`])((?:\\.|(?!\1).)*)\1.*?text:\s*(['\"`])((?:\\.|(?!\3).)*)\3", raw_js, re.S):
        co_title = _clean_str(com.group(2))
        co_text = _clean_str(com.group(4))
        lines.append(f"\nВажное правило («{co_title}»): {co_text}")

    # Code / Tables
    for tbl in re.finditer(r"caption:\s*['\"`](.*?)['\"`].*?head:\s*\[(.*?)\]", raw_js, re.S):
        cap = _clean_str(tbl.group(1))
        lines.append(f"\nТаблица / схема урока: {cap}")

    # 3. Practice (Практическая работа)
    lines.append("\n=======================================================")
    lines.append("РАЗДЕЛ: ПРАКТИЧЕСКАЯ РАБОТА И ЗАДАНИЯ (СТРОГО С ПЛАТФОРМЫ)")
    lines.append("=======================================================")
    
    # Lead instructions
    prac_m = re.search(r"k:\s*['\"]practice['\"].*?lead:\s*(['\"`])((?:\\.|(?!\1).)*)\1", raw_js, re.S)
    if prac_m:
        lines.append(f"Инструктаж к практической работе: {_clean_str(prac_m.group(2))}\n")

    # Before callout (конспект и условия)
    bef_m = re.search(r"k:\s*['\"]practice['\"].*?before:\s*\[.*?text:\s*(['\"`])((?:\\.|(?!\1).)*)\1", raw_js, re.S)
    if bef_m:
        lines.append(f"Задание в тетради / конспект: {_clean_str(bef_m.group(2))}\n")

    # Tasks
    tasks_block_m = re.search(r"k:\s*['\"]practice['\"].*?tasks:\s*\[(.*?)(?:\]\s*,\s*criteria|\]\s*\})", raw_js, re.S)
    if tasks_block_m:
        t_block = tasks_block_m.group(1)
        for t_idx, tm in enumerate(re.finditer(r"\{\s*title:\s*['\"`](.*?)['\"`]\s*,\s*q:\s*['\"`](.*?)['\"`].*?answer:\s*(?:['\"`](.*?)['\"`]|(\d+)|\[(.*?)\]).*?(?:explain:\s*['\"`](.*?)['\"`])?", t_block, re.S), 1):
            t_name = _clean_str(tm.group(1))
            t_q = _clean_str(tm.group(2))
            t_ans = _clean_str(tm.group(3) or tm.group(4) or tm.group(5) or "")
            t_exp = _clean_str(tm.group(6) or "")
            lines.append(f"Практическое задание {t_idx} («{t_name}»):")
            lines.append(f"  Условие: {t_q}")
            lines.append(f"  Правильный ответ / решение: {t_ans}")
            if t_exp:
                lines.append(f"  Пояснение к решению: {t_exp}")
            lines.append("")

    # Criteria / Rubrics
    crit_block_m = re.search(r"criteriaTitle:\s*['\"`](.*?)['\"`].*?criteria:\s*\[(.*?)\]", raw_js, re.S)
    if crit_block_m:
        crit_title = _clean_str(crit_block_m.group(1))
        lines.append(f"\nКРИТЕРИИ ОЦЕНИВАНИЯ И ДЕСКРИПТОРЫ ({crit_title}):")
        for cm in re.finditer(r"mark:\s*['\"`](.*?)['\"`]\s*,\s*text:\s*['\"`](.*?)['\"`]", crit_block_m.group(2)):
            lines.append(f"  - {_clean_str(cm.group(1))}: {_clean_str(cm.group(2))}")

    return {
        'title': title,
        'goal': full_goal,
        'slides_meta': get_q2_slides_meta(class_name, lesson_num),
        'content': '\n'.join(lines)
    }
