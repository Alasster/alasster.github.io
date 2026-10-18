import io
import csv
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def generate_csv_report(launch_info: dict, attempts: list, tasks: list, answers_by_attempt: dict) -> str:
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    
    # Заголовок
    writer.writerow(["Отчёт по результатам проведения"])
    writer.writerow(["Работа:", launch_info.get("title", "")])
    writer.writerow(["Предмет:", launch_info.get("subject", "")])
    writer.writerow(["Класс:", launch_info.get("grade_level", "")])
    writer.writerow([])

    # Шапка таблицы
    headers = ["№", "ФИО Ученика", "Класс", "Компьютер / Сеть", "Статус", "Дата сдачи", "Набранный балл", "Макс. балл", "% Выполнения"]
    for i, t in enumerate(tasks, 1):
        headers.append(f"Задание {i} (макс. {t['max_score']})")
    writer.writerow(headers)

    # Строки учеников
    for idx, att in enumerate(attempts, 1):
        total_score = 0.0
        stu_var = str(att.get("variant") or "1")
        stu_tasks = [t for t in tasks if str(t.get("variant") or "1") in (stu_var, "all", "1,2")] or tasks
        max_possible = sum(t["max_score"] for t in stu_tasks)
        att_answers = answers_by_attempt.get(att["id"], {})
        
        row = [
            idx,
            att["student_name"],
            att["student_class"],
            att.get("device_name") or att.get("ip_address") or "-",
            att["status"],
            att.get("submitted_at") or "-",
        ]

        task_scores = []
        for t in tasks:
            ans = att_answers.get(t["id"])
            if ans and ans.get("final_score") is not None:
                sc = float(ans["final_score"])
                total_score += sc
                task_scores.append(sc)
            else:
                task_scores.append(0.0)

        percent = round((total_score / max_possible * 100), 1) if max_possible > 0 else 0
        row.extend([total_score, max_possible, f"{percent}%"])
        row.extend(task_scores)
        writer.writerow(row)

    return output.getvalue()

def generate_excel_report(launch_info: dict, attempts: list, tasks: list, answers_by_attempt: dict) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Ведомость результатов"

    # Стили
    title_font = Font(name="Calibri", size=14, bold=True, color="1F2937")
    subtitle_font = Font(name="Calibri", size=11, bold=True, color="4B5563")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")
    accent_fill = PatternFill(start_color="EEF2FF", end_color="EEF2FF", fill_type="solid")
    total_fill = PatternFill(start_color="F3F4F6", end_color="F3F4F6", fill_type="solid")
    
    thin_border = Border(
        left=Side(style="thin", color="D1D5DB"),
        right=Side(style="thin", color="D1D5DB"),
        top=Side(style="thin", color="D1D5DB"),
        bottom=Side(style="thin", color="D1D5DB")
    )
    center_align = Alignment(horizontal="center", vertical="center")
    left_align = Alignment(horizontal="left", vertical="center")

    # Метаданные отчёта
    ws["A1"] = f"Ведомость оценивания: {launch_info.get('title', 'Работа')}"
    ws["A1"].font = title_font
    ws["A2"] = f"Предмет: {launch_info.get('subject', '')} | Класс: {launch_info.get('grade_level', '')} | Тип: {launch_info.get('exam_type', 'СОР')}"
    ws["A2"].font = subtitle_font

    start_row = 4
    headers = ["№", "ФИО Ученика", "Класс", "Компьютер / Сеть", "Статус", "Время сдачи", "Итог", "Макс", "%"]
    for i, t in enumerate(tasks, 1):
        headers.append(f"З-{i} ({t['max_score']} б.)")

    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=start_row, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center_align
        cell.border = thin_border

    current_row = start_row + 1
    for idx, att in enumerate(attempts, 1):
        total_score = 0.0
        stu_var = str(att.get("variant") or "1")
        stu_tasks = [t for t in tasks if str(t.get("variant") or "1") in (stu_var, "all", "1,2")] or tasks
        max_possible = sum(t["max_score"] for t in stu_tasks)
        att_answers = answers_by_attempt.get(att["id"], {})

        status_text = {
            "submitted": "Сдано",
            "time_expired": "Время истекло",
            "in_progress": "Выполняет",
            "in_waiting": "В ожидании",
            "blocked": "Заблокирован"
        }.get(att["status"], att["status"])

        ws.cell(row=current_row, column=1, value=idx).alignment = center_align
        ws.cell(row=current_row, column=2, value=att["student_name"]).alignment = left_align
        ws.cell(row=current_row, column=3, value=att["student_class"]).alignment = center_align
        ws.cell(row=current_row, column=4, value=att.get("device_name") or att.get("ip_address") or "-").alignment = center_align
        ws.cell(row=current_row, column=5, value=status_text).alignment = center_align
        ws.cell(row=current_row, column=6, value=att.get("submitted_at") or "-").alignment = center_align

        for col_idx in range(1, 7):
            ws.cell(row=current_row, column=col_idx).border = thin_border

        # Расчет по заданиям
        task_col_start = 10
        for t_idx, t in enumerate(tasks):
            ans = att_answers.get(t["id"])
            col_pos = task_col_start + t_idx
            c = ws.cell(row=current_row, column=col_pos)
            c.border = thin_border
            c.alignment = center_align
            if ans and ans.get("final_score") is not None:
                sc = float(ans["final_score"])
                total_score += sc
                c.value = sc
            else:
                c.value = 0.0

        percent = round((total_score / max_possible * 100), 1) if max_possible > 0 else 0

        # Итоговые ячейки
        cell_score = ws.cell(row=current_row, column=7, value=total_score)
        cell_score.font = Font(bold=True)
        cell_score.fill = accent_fill
        cell_score.alignment = center_align
        cell_score.border = thin_border

        cell_max = ws.cell(row=current_row, column=8, value=max_possible)
        cell_max.alignment = center_align
        cell_max.border = thin_border

        cell_pct = ws.cell(row=current_row, column=9, value=f"{percent}%")
        cell_pct.font = Font(bold=True)
        cell_pct.alignment = center_align
        cell_pct.border = thin_border

        current_row += 1

    # Вторая вкладка: Дескрипторы и задания
    ws_desc = wb.create_sheet(title="Задания и дескрипторы")
    desc_headers = ["№", "Тип задания", "Текст условия", "Макс. балл", "Критерии / Дескрипторы"]
    for c_idx, h in enumerate(desc_headers, 1):
        c = ws_desc.cell(row=1, column=c_idx, value=h)
        c.font = header_font
        c.fill = header_fill
        c.alignment = center_align
        c.border = thin_border

    type_names = {
        "single_choice": "Один правильный вариант",
        "multi_choice": "Несколько вариантов",
        "short_text": "Краткий ответ",
        "number": "Числовой ответ",
        "text_manual": "Развёрнутый ответ (ручная проверка)"
    }

    for idx, t in enumerate(tasks, 1):
        r = idx + 1
        ws_desc.cell(row=r, column=1, value=idx).alignment = center_align
        ws_desc.cell(row=r, column=2, value=type_names.get(t["question_type"], t["question_type"])).alignment = left_align
        ws_desc.cell(row=r, column=3, value=t["question_text"]).alignment = left_align
        ws_desc.cell(row=r, column=4, value=t["max_score"]).alignment = center_align
        ws_desc.cell(row=r, column=5, value=t.get("descriptor") or "-").alignment = left_align
        for col_idx in range(1, 6):
            ws_desc.cell(row=r, column=col_idx).border = thin_border

    # Авто-ширина колонок
    for sheet in [ws, ws_desc]:
        for col in sheet.columns:
            max_len = max(len(str(cell.value or "")) for cell in col)
            col_letter = get_column_letter(col[0].column)
            sheet.column_dimensions[col_letter].width = max(max_len + 3, 10)

    bio = io.BytesIO()
    wb.save(bio)
    return bio.getvalue()
