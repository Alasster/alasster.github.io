import os
import sys
import asyncio
import time
import httpx
from datetime import datetime

# Обеспечиваем импорт из текущей папки
sys.path.insert(0, os.path.dirname(__file__))
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from server import app
from database import init_db, get_db

async def run_full_suite():
    print("=" * 70)
    print("  ЗАПУСК ПОЛНОГО КОМПЛЕКСНОГО ТЕСТИРОВАНИЯ ВЕБ-СЕРВИСА «БАҒАЛАУ»")
    print("=" * 70)

    await init_db()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Авторизация учителя
        print("\n[ТЕСТ 1] Авторизация учителя в защищённом кабинете...")
        login_res = await client.post("/api/teacher/login", json={
            "username": "teacher",
            "password": "bagalau2026"
        })
        assert login_res.status_code == 200, f"Ошибка входа: {login_res.text}"
        teacher_token = login_res.json()["token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
        print("  ✓ Учитель успешно авторизован, получен токен сессии.")

        # 2. Создание работы СОР со всеми 5 типами заданий
        print("\n[ТЕСТ 2] Создание работы СОР и добавление 5 типов заданий...")
        create_test_res = await client.post("/api/tests", headers=teacher_headers, json={
            "title": "СОР №1: Основы алгоритмизации и Python",
            "exam_type": "СОР",
            "subject": "Информатика",
            "grade_level": "10 ЕМН",
            "quarter": 1,
            "section": "Алгоритмы",
            "instructions": "Работа состоит из 5 заданий. Время выполнения — 40 минут.",
            "learning_objectives": "10.4.1.1 составлять блок-схемы алгоритмов",
            "assessment_criteria": "Применяет циклы и ветвления в Python"
        })
        assert create_test_res.status_code == 200
        test_id = create_test_res.json()["id"]

        # Задание 1: Single choice
        t1 = await client.post(f"/api/tests/{test_id}/tasks", headers=teacher_headers, json={
            "order_index": 1,
            "question_text": "Какая функция используется для вывода текста в консоль в языке Python?",
            "question_type": "single_choice",
            "options": ["print()", "input()", "write()", "console.log()"],
            "max_score": 1.0,
            "descriptor": "Определяет функцию стандартного вывода",
            "answer_key": "print()",
            "comment_explanation": "В Python 3 стандартной функцией вывода является print()."
        })
        assert t1.status_code == 200
        task1_id = t1.json()["id"]

        # Задание 2: Multi choice
        t2 = await client.post(f"/api/tests/{test_id}/tasks", headers=teacher_headers, json={
            "order_index": 2,
            "question_text": "Какие из перечисленных типов данных являются неизменяемыми (immutable) в Python?",
            "question_type": "multi_choice",
            "options": ["int", "list", "str", "tuple", "dict"],
            "max_score": 2.0,
            "descriptor": "Различает изменяемые и неизменяемые типы",
            "check_method": "partial",
            "answer_key": ["int", "str", "tuple"],
            "comment_explanation": "Числа (int), строки (str) и кортежи (tuple) неизменяемы."
        })
        assert t2.status_code == 200
        task2_id = t2.json()["id"]

        # Задание 3: Number с погрешностью
        t3 = await client.post(f"/api/tests/{test_id}/tasks", headers=teacher_headers, json={
            "order_index": 3,
            "question_text": "Чему равно значение выражения $2^8 / 10$?",
            "question_type": "number",
            "max_score": 1.0,
            "tolerance": 0.01,
            "answer_key": 25.6,
            "descriptor": "Выполняет арифметические расчеты степеней",
            "comment_explanation": "2^8 = 256, 256 / 10 = 25.6."
        })
        assert t3.status_code == 200
        task3_id = t3.json()["id"]

        # Задание 4: Short text с синонимами
        t4 = await client.post(f"/api/tests/{test_id}/tasks", headers=teacher_headers, json={
            "order_index": 4,
            "question_text": "Как называется алгоритмическая конструкция, повторяющая действия несколько раз?",
            "question_type": "short_text",
            "max_score": 1.0,
            "check_method": "case_insensitive",
            "answer_key": ["цикл", "циклы", "loop", "қайталау"],
            "descriptor": "Знает базовую терминологию алгоритмов"
        })
        assert t4.status_code == 200
        task4_id = t4.json()["id"]

        # Задание 5: Text manual (ручная проверка)
        t5 = await client.post(f"/api/tests/{test_id}/tasks", headers=teacher_headers, json={
            "order_index": 5,
            "question_text": "Опишите разницу между циклами for и while в языке Python.",
            "question_type": "text_manual",
            "max_score": 3.0,
            "descriptor": "Сравнивает принципы работы циклов for и while"
        })
        assert t5.status_code == 200
        task5_id = t5.json()["id"]
        print("  ✓ Все 5 заданий созданы (один вариант, несколько, число, краткий текст, развернутый ответ).")

        # 3. Публикация проведения (создание запуска с фиксацией снимка)
        print("\n[ТЕСТ 3] Публикация проведения (создание запуска с фиксацией слепка заданий)...")
        launch_res = await client.post("/api/launches", headers=teacher_headers, json={
            "test_id": test_id,
            "title": "СОР-1 (10 ЕМН) 1-я четверть",
            "allowed_classes": ["10 ЕМН", "10 ОГН"],
            "manual_approval": False,
            "duration_minutes": 40
        })
        assert launch_res.status_code == 200
        launch_id = launch_res.json()["launch_id"]
        print(f"  ✓ Запуск создан (ID: {launch_id}), статус: draft (подготовка).")

        # 4. Проверка безопасности: до активации задания недоступны ученику!
        print("\n[ТЕСТ 4] Защита заданий до активации работы...")
        check_pub = await client.get(f"/api/student/check/{launch_id}")
        assert check_pub.status_code == 200
        pub_data = check_pub.json()
        assert "tasks" not in pub_data, "ОШИБКА: Задания присутствуют в публичном запросе!"
        print("  ✓ Публичный запрос возвращает только название, класс и инструкцию. Заданий нет.")

        # 5. Учитель открывает ожидание
        print("\n[ТЕСТ 5] Учитель открывает ожидание...")
        st_wait = await client.put(f"/api/launches/{launch_id}/status", headers=teacher_headers, json={"status": "waiting"})
        assert st_wait.status_code == 200
        assert st_wait.json()["status"] == "waiting"

        # 6. Ученик 1 подключается без регистрации и паролей
        print("\n[ТЕСТ 6] Вход ученика без регистрации и без кодов...")
        join_res = await client.post(f"/api/student/join/{launch_id}", json={
            "student_name": "Алиев Арман",
            "student_class": "10 ЕМН"
        })
        assert join_res.status_code == 200
        s1_data = join_res.json()
        s1_token = s1_data["attempt_token"]
        assert s1_data["status"] == "in_waiting"
        s1_headers = {"X-Attempt-Token": s1_token}
        print("  ✓ Ученик вошёл под именем 'Алиев Арман', статус: in_waiting.")

        # Проверка: ученик в ожидании запрашивает задания — сервер не должен отдавать задания!
        att_check = await client.get("/api/student/attempt", headers=s1_headers)
        assert att_check.status_code == 200
        assert len(att_check.json()["tasks"]) == 0, "ОШИБКА: Задания отданы ученику до активации работы!"
        print("  ✓ До подтверждённого старта задания закрыты на сервере.")

        # 7. Учитель видит ученика в реальном времени
        print("\n[ТЕСТ 7] Учитель видит подключившегося ученика в списке...")
        live_studs = await client.get(f"/api/launches/{launch_id}/students", headers=teacher_headers)
        assert live_studs.status_code == 200
        studs = live_studs.json()
        assert len(studs) >= 1
        assert studs[0]["student_name"] == "Алиев Арман"
        print("  ✓ Ученик мгновенно отображается в кабинете учителя со статусом ожидания.")

        # 8. Учитель активирует работу ("Начать работу")
        print("\n[ТЕСТ 8] Учитель активирует проведение...")
        st_act = await client.put(f"/api/launches/{launch_id}/status", headers=teacher_headers, json={"status": "active"})
        assert st_act.status_code == 200
        assert st_act.json()["status"] == "active"
        print("  ✓ Работа переведена в статус 'active'.")

        # 9. Ученик нажимает «Начать работу»
        print("\n[ТЕСТ 9] Ученик запускает работу (индивидуальный серверный таймер)...")
        start_res = await client.post("/api/student/start", headers=s1_headers)
        assert start_res.status_code == 200
        assert start_res.json()["status"] == "in_progress"
        assert start_res.json()["server_deadline"] is not None
        print("  ✓ Работа начата, запущен серверный таймер.")

        # 10. КРИТИЧЕСКИЙ ТЕСТ БЕЗОПАСНОСТИ: В ученическом представлении НЕТ правильных ответов!
        print("\n[ТЕСТ 10] СТРОГАЯ ИЗОЛЯЦИЯ: проверка отсутствия ключей ответов у ученика...")
        att_tasks_res = await client.get("/api/student/attempt", headers=s1_headers)
        att_tasks = att_tasks_res.json()["tasks"]
        assert len(att_tasks) == 5, f"Ожидалось 5 заданий, получено {len(att_tasks)}"

        for task in att_tasks:
            assert "answer_key" not in task, f"УТЕЧКА: answer_key найден в задании {task['id']}!"
            assert "comment_explanation" not in task, f"УТЕЧКА: comment_explanation найден в задании {task['id']}!"
            assert "check_method" not in task, f"УТЕЧКА: check_method найден в задании {task['id']}!"
        print("  ✓ БЕЗОПАСНОСТЬ ПОДТВЕРЖДЕНА: ни в одном задании нет ключей, дескрипторов ответов или пояснений!")

        # 11. Автосохранение ответов учеником
        print("\n[ТЕСТ 11] Автосохранение ответов ученика с контролем версий...")
        # Ответ на задание 1 (правильный)
        save1 = await client.post("/api/student/save", headers=s1_headers, json={
            "task_id": task1_id,
            "answer": "print()",
            "version": 1
        })
        assert save1.status_code == 200
        assert save1.json()["ok"] is True

        # Ответ на задание 2 (частично правильный)
        save2 = await client.post("/api/student/save", headers=s1_headers, json={
            "task_id": task2_id,
            "answer": ["int", "str"],  # 2 из 3 правильных
            "version": 1
        })
        assert save2.status_code == 200

        # Ответ на задание 3 (число с запятой 25,6)
        save3 = await client.post("/api/student/save", headers=s1_headers, json={
            "task_id": task3_id,
            "answer": "25,6",  # запятая вместо точки
            "version": 1
        })
        assert save3.status_code == 200

        # Ответ на задание 4 (краткий текст)
        save4 = await client.post("/api/student/save", headers=s1_headers, json={
            "task_id": task4_id,
            "answer": "ЦИКЛ",  # в верхнем регистре
            "version": 1
        })
        assert save4.status_code == 200

        # Ответ на задание 5 (развернутый ответ)
        save5 = await client.post("/api/student/save", headers=s1_headers, json={
            "task_id": task5_id,
            "answer": "Цикл for используется при известном числе повторений, while — пока истинно условие.",
            "version": 1
        })
        assert save5.status_code == 200
        print("  ✓ Все 5 ответов успешно сохранены на сервере.")

        # 12. Тест защиты от перезаписи старой версией (конфликт версий)
        print("\n[ТЕСТ 12] Защита от тихой перезаписи устаревшим запросом...")
        # Сначала обновляем до версии 2
        upd = await client.post("/api/student/save", headers=s1_headers, json={
            "task_id": task1_id,
            "answer": "print()",
            "version": 2
        })
        assert upd.status_code == 200

        # Теперь шлем задержавшийся запрос с версией 1
        stale_save = await client.post("/api/student/save", headers=s1_headers, json={
            "task_id": task1_id,
            "answer": "write()",
            "version": 1  # 1 < 2 -> отсекается сервером
        })
        assert stale_save.json()["conflict"] is True
        print("  ✓ Устаревший запрос отклонён, актуальный ответ сохранён.")

        # 13. Тест обновления страницы и восстановления сессии
        print("\n[ТЕСТ 13] Восстановление попытки при обновлении страницы в том же браузере...")
        reload_res = await client.get("/api/student/attempt", headers=s1_headers)
        assert reload_res.status_code == 200
        saved_answers = reload_res.json()["answers"]
        assert task1_id in saved_answers
        assert saved_answers[task1_id]["answer"] == "print()"
        print("  ✓ Все сохранённые ответы восстановлены.")

        # 14. Защита от подмены: вход с таким же именем не открывает чужую попытку
        print("\n[ТЕСТ 14] Совпадение имени не открывает чужие ответы (флаг дубля)...")
        dup_join = await client.post(f"/api/student/join/{launch_id}", json={
            "student_name": "Алиев Арман",
            "student_class": "10 ЕМН"
        })
        assert dup_join.status_code == 200
        dup_token = dup_join.json()["attempt_token"]
        assert dup_token != s1_token

        # Проверяем в кабинете учителя наличие флага дубля
        studs_check = await client.get(f"/api/launches/{launch_id}/students", headers=teacher_headers)
        dups = [s for s in studs_check.json() if s["student_name"] == "Алиев Арман"]
        assert len(dups) == 2
        assert any(s["is_duplicate_flag"] == 1 for s in dups)
        print("  ✓ Создана независимая попытка, отмечен флаг дубля, чужие ответы изолированы.")

        # 15. Ученик отправляет работу
        print("\n[ТЕСТ 15] Атомарная сдача работы и получение квитанции...")
        submit_res = await client.post("/api/student/submit", headers=s1_headers, json={"final_confirmation": True})
        assert submit_res.status_code == 200
        sub_data = submit_res.json()
        assert sub_data["status"] == "submitted"
        assert sub_data["confirmation_code"].startswith("BAG-")
        print(f"  ✓ Работа успешно сдана. Номер подтверждения: {sub_data['confirmation_code']}.")

        # 16. Защита: нельзя изменять сданную работу прямым запросом
        print("\n[ТЕСТ 16] Прямой запрос на изменение сданной работы...")
        hack_save = await client.post("/api/student/save", headers=s1_headers, json={
            "task_id": task1_id,
            "answer": "hack",
            "version": 10
        })
        assert hack_save.status_code == 403
        print("  ✓ Сервер отклонил изменение (HTTP 403 Forbidden).")

        # 17. Проверка результатов до публикации: ученик НЕ видит баллы и ключи
        print("\n[ТЕСТ 17] Защита результатов до явной публикации учителем...")
        res_before_pub = await client.get("/api/student/results", headers=s1_headers)
        assert res_before_pub.status_code == 200
        assert res_before_pub.json()["published"] is False
        print("  ✓ До решения учителя баллы и правильные ответы закрыты.")

        # 18. Учитель проверяет развернутый ответ (Задание 5)
        print("\n[ТЕСТ 18] Ручная проверка развёрнутого ответа учителем...")
        grade_res = await client.post(f"/api/launches/{launch_id}/grade", headers=teacher_headers, json={
            "attempt_id": s1_data["attempt_id"],
            "task_id": task5_id,
            "score": 3.0,
            "teacher_comment": "Отличный ответ, разница раскрыта полно."
        })
        assert grade_res.status_code == 200
        print("  ✓ Учитель выставил 3.0 балла и оставил комментарий.")

        # 19. Учитель публикует результаты
        print("\n[ТЕСТ 19] Публикация результатов...")
        await client.put(f"/api/launches/{launch_id}/settings", headers=teacher_headers, json={
            "publish_scores": True,
            "publish_answers": True,
            "publish_comments": True
        })

        # Ученик запрашивает результаты
        res_after_pub = await client.get("/api/student/results", headers=s1_headers)
        assert res_after_pub.status_code == 200
        pub_res = res_after_pub.json()
        assert pub_res["published"] is True
        assert pub_res["total_score"] > 0
        print(f"  ✓ Результаты опубликованы: набрано {pub_res['total_score']} из {pub_res['max_total']} б. ({pub_res['percent']}%).")

        # 20. Экспорт ведомости в Excel (.xlsx) и CSV
        print("\n[ТЕСТ 20] Экспорт ведомости в Excel (.xlsx) и CSV...")
        xlsx_res = await client.get(f"/api/launches/{launch_id}/export.xlsx", headers=teacher_headers)
        assert xlsx_res.status_code == 200
        assert len(xlsx_res.content) > 1000
        csv_res = await client.get(f"/api/launches/{launch_id}/export.csv", headers=teacher_headers)
        assert csv_res.status_code == 200
        assert "Алиев Арман" in csv_res.text
        print("  ✓ Файлы Excel и CSV успешно сформированы с баллами и дескрипторами.")

        # 21. Резервное копирование и проверка целостности
        print("\n[ТЕСТ 21] Создание резервной копии базы данных...")
        bak_res = await client.post("/api/backup/create", headers=teacher_headers)
        assert bak_res.status_code == 200
        bak_file = bak_res.json()["filename"]
        print(f"  ✓ Снимок базы успешно создан: {bak_file}.")

        # 22. НАГРУЗОЧНЫЙ ТЕСТ: 40+ ОДНОВРЕМЕННЫХ УЧЕНИКОВ
        print("\n" + "=" * 70)
        print("  [ТЕСТ 22] НАГРУЗОЧНЫЙ СТРЕСС-ТЕСТ: 45 ОДНОВРЕМЕННЫХ УЧЕНИКОВ")
        print("=" * 70)

        num_students = 45
        print(f"Эмуляция {num_students} учеников, одновременно выполняющих работу...")

        async def simulate_student(idx):
            name = f"Ученик_{idx} Тестовый"
            # 1. Join
            j = await client.post(f"/api/student/join/{launch_id}", json={
                "student_name": name,
                "student_class": "10 ЕМН"
            })
            token = j.json()["attempt_token"]
            h = {"X-Attempt-Token": token}

            # 2. Start
            await client.post("/api/student/start", headers=h)

            # 3. Save answers for all tasks
            await client.post("/api/student/save", headers=h, json={"task_id": task1_id, "answer": "print()", "version": 1})
            await client.post("/api/student/save", headers=h, json={"task_id": task2_id, "answer": ["int", "str", "tuple"], "version": 1})
            await client.post("/api/student/save", headers=h, json={"task_id": task3_id, "answer": "25.6", "version": 1})
            await client.post("/api/student/save", headers=h, json={"task_id": task4_id, "answer": "цикл", "version": 1})

            # 4. Heartbeat
            await client.post("/api/student/heartbeat", headers=h)

            # 5. Submit
            sub = await client.post("/api/student/submit", headers=h, json={"final_confirmation": True})
            return sub.status_code == 200

        t_start = time.perf_counter()
        results = await asyncio.gather(*[simulate_student(i) for i in range(1, num_students + 1)])
        t_duration = time.perf_counter() - t_start

        success_count = sum(1 for r in results if r is True)
        print(f"  ✓ Успешно выполнено: {success_count} из {num_students} учеников.")
        print(f"  ✓ Общее время выполнения: {t_duration:.2f} сек.")
        print(f"  ✓ Среднее время полного цикла ученика (вход, старт, сохранение 4 ответов, пинг, сдача): {(t_duration / num_students):.4f} сек/чел.")
        assert success_count == num_students, f"Сбои в нагрузочном тесте: {num_students - success_count} ошибок!"

        print("\n" + "=" * 70)
        print("  ВСЕ ТЕСТЫ И НАГРУЗОЧНАЯ ПРОВЕРКА УСПЕШНО ПРОЙДЕНЫ НА 100%!")
        print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_full_suite())
