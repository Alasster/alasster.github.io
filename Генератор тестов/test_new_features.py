import os
import sys
import asyncio
import httpx

sys.path.insert(0, os.path.dirname(__file__))

from evaluator import evaluate_answer
from server import app
from database import init_db

async def run_new_features_tests():
    print("=" * 65)
    print("  ПРОВЕРКА НОВЫХ ФУНКЦИЙ СИСТЕМЫ «БАҒАЛАУ»")
    print("=" * 65)

    await init_db()

    # 1. Проверка 10 автопроверяемых типов в evaluator
    print("\n[1] Проверка 10 типов заданий с автопроверкой:")
    
    # 1.1 Single choice
    sc, gr = evaluate_answer("single_choice", "Принтер", "Принтер", 1.0)
    assert sc == 1.0 and gr, "Ошибка single_choice"
    print("  ✓ 1. Один выбор (single_choice) работает корректно")

    # 1.2 Multi choice
    sc, gr = evaluate_answer("multi_choice", ["CPU", "RAM"], ["CPU", "RAM", "GPU"], 3.0, check_method="partial")
    assert round(sc, 2) == 2.0 and gr, f"Ошибка multi_choice: {sc}"
    print("  ✓ 2. Множественный выбор (multi_choice partial) работает корректно")

    # 1.3 Number
    sc, gr = evaluate_answer("number", "3,1415", "3.14", 1.0, tolerance=0.01)
    assert sc == 1.0 and gr, "Ошибка number"
    print("  ✓ 3. Числовой ответ с погрешностью (number) работает корректно")

    # 1.4 Short text
    sc, gr = evaluate_answer("short_text", "алгоритмы", "алгоритм; алгоритмы; algorithm", 1.0)
    assert sc == 1.0 and gr, "Ошибка short_text"
    print("  ✓ 4. Краткий текст с синонимами (short_text) работает корректно")

    # 1.5 Fill blank
    sc, gr = evaluate_answer("fill_blank", "процессор", "процессор; cpu", 1.0)
    assert sc == 1.0 and gr, "Ошибка fill_blank"
    print("  ✓ 5. Заполни пропуск (fill_blank) работает корректно")

    # 1.6 True / False
    sc, gr = evaluate_answer("true_false", "Верно", "Верно", 1.0)
    assert sc == 1.0 and gr, "Ошибка true_false"
    print("  ✓ 6. Верно / Неверно (true_false) работает корректно")

    # 1.7 Ordering
    sc, gr = evaluate_answer("ordering", ["Шаг 1", "Шаг 2", "Шаг 3"], ["Шаг 1", "Шаг 2", "Шаг 3"], 2.0)
    assert sc == 2.0 and gr, "Ошибка ordering"
    print("  ✓ 7. Восстановление последовательности (ordering) работает корректно")

    # 1.8 Matching
    pairs = {"Клавиатура": "Ввод", "Монитор": "Вывод"}
    sc, gr = evaluate_answer("matching", {"Клавиатура": "Ввод", "Монитор": "Вывод"}, pairs, 2.0)
    assert sc == 2.0 and gr, "Ошибка matching"
    print("  ✓ 8. Сопоставление пар (matching) работает корректно")

    # 1.9 Dropdown in sentence
    sc, gr = evaluate_answer("dropdown", "ОЗУ", "ОЗУ", 1.0)
    assert sc == 1.0 and gr, "Ошибка dropdown"
    print("  ✓ 9. Выпадающий список (dropdown) работает корректно")

    # 1.10 Group classification
    cats = {"Мышь": "Ввод", "Сканер": "Ввод", "Динамик": "Вывод"}
    student_cats = {"Мышь": "Ввод", "Сканер": "Ввод", "Динамик": "Вывод"}
    sc, gr = evaluate_answer("group_classification", student_cats, cats, 3.0)
    assert sc == 3.0 and gr, "Ошибка group_classification"
    print("  ✓ 10. Распределение по двум категориям (group_classification) работает корректно")

    # 2. Интеграционное тестирование API
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Авторизация учителя
        login_res = await client.post("/api/teacher/login", json={"username": "teacher", "password": "bagalau2026"})
        token = login_res.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2.1 Создание теста с буквами А-П и вариантом
        print("\n[2] Проверка создания теста с буквами классов и вариантом...")
        t_res = await client.post("/api/tests", headers=headers, json={
            "title": "Тестовый СОР по новым типам",
            "exam_type": "СОР",
            "subject": "Информатика",
            "grade_level": "9",
            "class_letters": ["А", "Б", "В", "Г"],
            "variant": "2",
            "bg_color": "#E6F4EA",
            "quarter": 1,
            "section": "Архитектура ПК"
        })
        assert t_res.status_code == 200
        test_id = t_res.json()["id"]

        get_res = await client.get(f"/api/tests/{test_id}", headers=headers)
        test_data = get_res.json()
        assert test_data["variant"] == "2"
        assert test_data["class_letters"] == ["А", "Б", "В", "Г"]
        assert test_data["bg_color"] == "#E6F4EA"
        print("  ✓ Тест создан: класс 9, буквы ['А', 'Б', 'В', 'Г'], вариант 2, цвет фона #E6F4EA")

        # 2.2 Добавление задания с картинкой
        task_res = await client.post(f"/api/tests/{test_id}/tasks", headers=headers, json={
            "order_index": 1,
            "question_text": "Определите назначение устройства на рисунке:",
            "question_type": "single_choice",
            "options": ["Процессор", "ОЗУ", "Материнская плата", "Видеокарта"],
            "max_score": 1.0,
            "answer_key": "Процессор",
            "image_url": "https://example.com/cpu.jpg",
            "image_size": "450px",
            "image_align": "center"
        })
        assert task_res.status_code == 200
        print("  ✓ Задание с картинкой (450px, center) успешно добавлено")

        # 2.3 Архивирование, восстановление и удаление из архива
        print("\n[3] Проверка работы архива:")
        del_to_arch = await client.delete(f"/api/tests/{test_id}", headers=headers)
        assert del_to_arch.json().get("archived") == True
        print("  ✓ Работа перемещена в архив")

        restore_res = await client.post(f"/api/tests/{test_id}/restore", headers=headers)
        assert restore_res.json().get("restored") == True
        print("  ✓ Работа успешно восстановлена из архива")

        # 2.4 Создание и удаление проведения
        print("\n[4] Проверка создания и удаления проведения:")
        l_res = await client.post("/api/launches", headers=headers, json={
            "test_id": test_id,
            "title": "СОР 9 класс (Вариант 2)",
            "allowed_classes": ["9 А", "9 Б"],
            "duration_minutes": 30
        })
        assert l_res.status_code == 200
        launch_id = l_res.json()["launch_id"]
        print(f"  ✓ Сессия проведения создана (ID: {launch_id})")

        # Активируем запуск
        await client.put(f"/api/launches/{launch_id}/status", headers=headers, json={"status": "active"})

        # Ученик проходит работу и мгновенно получает результат
        print("\n[5] Проверка прохождения учеником и мгновенных итогов:")
        j_res = await client.post(f"/api/student/join/{launch_id}", json={
            "student_name": "Бериков Нурсултан",
            "student_class": "9 А"
        })
        assert j_res.status_code == 200
        stu_token = j_res.json()["attempt_token"]
        s_headers = {"X-Attempt-Token": stu_token}

        # Старт
        await client.post("/api/student/start", headers=s_headers)

        # Сохранение правильного ответа
        task1_id = task_res.json()["id"]
        await client.post("/api/student/save", headers=s_headers, json={
            "task_id": task1_id,
            "answer": "Процессор",
            "version": 1
        })

        # Сдача работы
        sub_res = await client.post("/api/student/submit", headers=s_headers, json={"final_confirmation": True})
        assert sub_res.status_code == 200
        sub_data = sub_res.json()
        assert sub_data["completed_count"] == 1
        assert sub_data["total_score"] == 1.0
        assert sub_data["max_score"] == 1.0
        print(f"  ✓ Мгновенный результат ученика: выполнено {sub_data['completed_count']} из {sub_data['total_tasks']}, балл: {sub_data['total_score']} из {sub_data['max_score']}")

        # 2.5 Создание страницы урока на сайте alasster.github.io
        print("\n[6] Проверка генератора страниц урока на сайте alasster.github.io:")
        site_page_res = await client.post("/api/site/create_lesson", headers=headers, json={
            "grade_folder": "9 класс",
            "quarter_folder": "1 четверть",
            "lesson_number": "СОР 1",
            "lesson_title": "Суммативное оценивание по архитектуре ПК",
            "launch_id": launch_id
        })
        assert site_page_res.status_code == 200
        sp_data = site_page_res.json()
        assert os.path.exists(sp_data["absolute_path"]), "Файл урока не создан на диске"
        print(f"  ✓ Страница урока успешно сгенерирована и сохранена в:\n    {sp_data['relative_path']}")

        # Удаление запуска
        del_launch_res = await client.delete(f"/api/launches/{launch_id}", headers=headers)
        assert del_launch_res.status_code == 200
        print("  ✓ Проведение удалено из вкладки «Проведение»")

        # Удаление теста навсегда из архива
        del_perm_res = await client.delete(f"/api/tests/{test_id}/permanent", headers=headers)
        assert del_perm_res.status_code == 200
        print("  ✓ Работа безвозвратно удалена из архива")

    print("\n" + "=" * 65)
    print("  ВСЕ НОВЫЕ ТРЕБОВАНИЯ И ФУНКЦИИ УСПЕШНО ПРОТЕСТИРОВАНЫ!")
    print("=" * 65)

if __name__ == "__main__":
    asyncio.run(run_new_features_tests())
