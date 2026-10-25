import json
import math
from typing import Tuple, Any, Optional, List, Dict

def normalize_text(text: str) -> str:
    if not text:
        return ""
    return " ".join(str(text).strip().split())

def evaluate_answer(
    task_type: str,
    student_answer: Any,
    answer_key: Any,
    max_score: float,
    check_method: str = "exact",
    tolerance: float = 0.0
) -> Tuple[float, bool]:
    """
    Возвращает кортеж (score, is_graded).
    10 типов заданий с полной автоматической проверкой:
    1. single_choice (Один выбор)
    2. multi_choice (Множественный выбор)
    3. number (Числовой ответ с погрешностью)
    4. short_text (Короткий текст со списком синонимов)
    5. fill_blank (Вставка пропущенного слова / заполни пропуск)
    6. true_false (Верно / Неверно)
    7. ordering (Восстановление последовательности)
    8. matching (Сопоставление пар)
    9. dropdown (Выпадающий список в тексте)
    10. group_classification (Распределение по 2 категориям / корзинам)
    """
    if student_answer is None or student_answer == "":
        return 0.0, True

    if task_type == "text_manual":
        return 0.0, False

    # 1. Один выбор
    if task_type == "single_choice":
        s_ans = normalize_text(str(student_answer))
        k_ans = normalize_text(str(answer_key))
        if s_ans.lower() == k_ans.lower() or s_ans == k_ans:
            return float(max_score), True
        return 0.0, True

    # 2. Множественный выбор
    if task_type == "multi_choice":
        s_list = student_answer if isinstance(student_answer, list) else [student_answer]
        s_clean = {normalize_text(str(x)).lower() for x in s_list if x is not None}
        
        k_list = answer_key if isinstance(answer_key, list) else [answer_key]
        k_clean = {normalize_text(str(x)).lower() for x in k_list if x is not None}

        if not k_clean:
            return 0.0, True

        if check_method == "all_or_nothing":
            if s_clean == k_clean:
                return float(max_score), True
            return 0.0, True
        else:
            correct_picked = len(s_clean.intersection(k_clean))
            wrong_picked = len(s_clean - k_clean)
            total_correct = len(k_clean)

            fraction = (correct_picked - wrong_picked) / total_correct
            if fraction < 0:
                fraction = 0.0
            score = round(fraction * max_score, 2)
            return float(score), True

    # 3. Числовой ответ
    if task_type == "number":
        try:
            s_str = str(student_answer).replace(",", ".").strip()
            s_val = float(s_str)
            k_str = str(answer_key).replace(",", ".").strip()
            k_val = float(k_str)

            tol = abs(float(tolerance or 0.0))
            if abs(s_val - k_val) <= tol:
                return float(max_score), True
            return 0.0, True
        except (ValueError, TypeError):
            return 0.0, True

    # 4. Короткий текстовый ответ
    if task_type == "short_text":
        s_text = normalize_text(str(student_answer))
        if isinstance(answer_key, list):
            keys = [normalize_text(str(k)) for k in answer_key]
        else:
            raw_k = str(answer_key)
            if ";" in raw_k:
                keys = [normalize_text(k) for k in raw_k.split(";")]
            else:
                keys = [normalize_text(raw_k)]

        is_case_sensitive = (check_method == "case_sensitive")
        for key in keys:
            if not key:
                continue
            if is_case_sensitive:
                if s_text == key:
                    return float(max_score), True
            else:
                if s_text.lower() == key.lower():
                    return float(max_score), True
        return 0.0, True

    # 5. Заполни пропуск (Fill in the blank)
    if task_type == "fill_blank":
        # student_answer может быть строкой или списком/словарем строк
        if isinstance(answer_key, dict) and isinstance(student_answer, dict):
            total_blanks = len(answer_key)
            if total_blanks == 0:
                return 0.0, True
            correct_cnt = 0
            for k, expected_raw in answer_key.items():
                s_val = normalize_text(str(student_answer.get(k, ""))).lower()
                # expected может быть строкой синонимов через точку с запятой
                if isinstance(expected_raw, list):
                    options = [normalize_text(str(x)).lower() for x in expected_raw]
                else:
                    options = [normalize_text(x).lower() for x in str(expected_raw).split(";")]
                if s_val in options:
                    correct_cnt += 1
            fraction = correct_cnt / total_blanks
            return float(round(fraction * max_score, 2)), True
        else:
            # Одиночный пропуск
            s_text = normalize_text(str(student_answer)).lower()
            if isinstance(answer_key, list):
                keys = [normalize_text(str(k)).lower() for k in answer_key]
            else:
                keys = [normalize_text(k).lower() for k in str(answer_key).split(";")]
            if s_text in keys:
                return float(max_score), True
            return 0.0, True

    # 6. Верно / Неверно (True / False)
    if task_type == "true_false":
        s_ans = normalize_text(str(student_answer)).lower()
        k_ans = normalize_text(str(answer_key)).lower()
        
        # Нормализация русских и английских обозначений
        truthy = ["верно", "истина", "true", "1", "да"]
        falsy = ["неверно", "ложь", "false", "0", "нет"]

        s_bool = True if s_ans in truthy else (False if s_ans in falsy else None)
        k_bool = True if k_ans in truthy else (False if k_ans in falsy else None)

        if s_bool is not None and s_bool == k_bool:
            return float(max_score), True
        elif s_ans == k_ans:
            return float(max_score), True
        return 0.0, True

    # 7. Восстановление последовательности (Ordering / Sequence)
    if task_type == "ordering":
        # Ожидаем список элементов в порядке, установленном учеником
        s_list = [normalize_text(str(x)) for x in student_answer] if isinstance(student_answer, list) else []
        k_list = [normalize_text(str(x)) for x in answer_key] if isinstance(answer_key, list) else []

        if not k_list or len(s_list) != len(k_list):
            return 0.0, True

        if check_method == "all_or_nothing":
            if s_list == k_list:
                return float(max_score), True
            return 0.0, True
        else:
            # Частичный балл: позиционное совпадение
            correct_positions = sum(1 for s, k in zip(s_list, k_list) if s == k)
            fraction = correct_positions / len(k_list)
            return float(round(fraction * max_score, 2)), True

    # 8. Сопоставление пар (Matching)
    if task_type == "matching":
        # student_answer: dict { "термин1": "определение1", ... }
        # answer_key: dict { "термин1": "определение1", ... }
        if not isinstance(student_answer, dict) or not isinstance(answer_key, dict):
            return 0.0, True

        total_pairs = len(answer_key)
        if total_pairs == 0:
            return 0.0, True

        correct_pairs = 0
        for left_item, right_expected in answer_key.items():
            s_val = normalize_text(str(student_answer.get(left_item, ""))).lower()
            k_val = normalize_text(str(right_expected)).lower()
            if s_val == k_val and s_val != "":
                correct_pairs += 1

        fraction = correct_pairs / total_pairs
        return float(round(fraction * max_score, 2)), True

    # 9. Выпадающий список в предложении (Dropdown in sentence)
    if task_type == "dropdown":
        s_ans = normalize_text(str(student_answer)).lower()
        k_ans = normalize_text(str(answer_key)).lower()
        if s_ans == k_ans and s_ans != "":
            return float(max_score), True
        return 0.0, True

    # 10. Распределение по двум категориям/корзинам (Group classification)
    if task_type == "group_classification":
        # answer_key: dict { "элемент": "Категория 1", ... }
        # student_answer: dict { "элемент": "Категория 1", ... } или { "Категория 1": ["элемент1"], "Категория 2": [...] }
        if not isinstance(answer_key, dict):
            return 0.0, True

        total_items = len(answer_key)
        if total_items == 0:
            return 0.0, True

        # Приводим student_answer к плоскому dict { "элемент": "Категория" }
        flat_student = {}
        if isinstance(student_answer, dict):
            for k, v in student_answer.items():
                if isinstance(v, list):
                    # { "Категория": ["эл1", "эл2"] }
                    for item in v:
                        flat_student[normalize_text(str(item))] = normalize_text(str(k))
                else:
                    flat_student[normalize_text(str(k))] = normalize_text(str(v))

        correct_cnt = 0
        for item, correct_cat in answer_key.items():
            item_norm = normalize_text(str(item))
            cat_norm = normalize_text(str(correct_cat)).lower()
            s_cat = flat_student.get(item_norm, "").lower()
            if s_cat == cat_norm and s_cat != "":
                correct_cnt += 1

        fraction = correct_cnt / total_items
        return float(round(fraction * max_score, 2)), True

    return 0.0, True
