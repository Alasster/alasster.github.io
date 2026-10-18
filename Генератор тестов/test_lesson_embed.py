"""Exercise lesson creation in an isolated site/database (no user files changed)."""
import asyncio
import os
from pathlib import Path
import shutil
import tempfile

import httpx
import database
import server


async def check():
    original_base = server.BASE_DIR
    original_db = database.DB_PATH
    original_dir = database.DB_DIR
    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)
        generator = root / 'generator'
        (generator / 'templates').mkdir(parents=True)
        shutil.copy(Path(original_base) / 'templates/lesson.html', generator / 'templates/lesson.html')
        (root / 'скрипты').mkdir()
        for filename in ('script.js', 'lessons.js'):
            shutil.copy(Path(original_base).parent / 'скрипты' / filename, root / 'скрипты' / filename)
        server.BASE_DIR = str(generator)
        database.DB_DIR = str(generator / 'data')
        database.DB_PATH = str(generator / 'data/test.sqlite3')
        try:
            await database.init_db()
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=server.app), base_url='http://127.0.0.1:8000') as client:
                login = await client.post('/api/teacher/login', json={'username': 'teacher', 'password': 'bagalau2026'})
                client.headers['Authorization'] = 'Bearer ' + login.json()['token']
                work = (await client.post('/api/tests', json={'title': 'Embed test', 'subject': 'Test', 'grade_level': '9'})).json()
                await client.post(f'/api/tests/{work["id"]}/tasks', json={'question_text': 'PRIVATE QUESTION', 'question_type': 'single_choice', 'options': ['A', 'B'], 'answer_key': 'SECRET KEY'})
                launch = (await client.post('/api/launches', json={'test_id': work['id'], 'allowed_classes': ['9 А']})).json()['launch_id']
                result = await client.post('/api/site/create_lesson', json={'grade_folder': '9 класс', 'quarter_folder': '1 четверть', 'lesson_number': 'Проверка', 'lesson_title': 'Маяк <1810>', 'launch_id': launch})
                assert result.status_code == 200, result.text
                relative = '9 класс/1 четверть/Проверка.html'
                assert result.json()['relative_path'] == relative
                html = (root / relative).read_text(encoding='utf-8')
                assert f'src="http://127.0.0.1:8000/exam/{launch}"' in html
                assert html.index('id="lesson-title"') < html.index('<iframe')
                assert 'Маяк &lt;1810&gt;' in html
                assert 'SECRET KEY' not in html and 'PRIVATE QUESTION' not in html
                assert 'checkNativeTask' not in html
                for filename in ('script.js', 'lessons.js'):
                    assert relative in (root / 'скрипты' / filename).read_text(encoding='utf-8')
                # Verify the wrapper refers to the existing student route, not a copied form.
                server.BASE_DIR = original_base
                exam = await client.get(f'/exam/{launch}')
                assert exam.status_code == 200
                assert 'student.js' in exam.text and 'exam-content-guard.js' in exam.text
                print('PASS: lesson path/menu, title then exact exam iframe, escaped title, no embedded keys, original student UI and copy guard.')
        finally:
            server.BASE_DIR = original_base
            database.DB_DIR = original_dir
            database.DB_PATH = original_db


if __name__ == '__main__':
    asyncio.run(check())
