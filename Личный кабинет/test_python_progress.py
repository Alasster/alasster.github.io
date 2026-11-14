"""Offline regression tests. Does not import server or open production databases."""
import sqlite3
import ast
from types import SimpleNamespace
import tempfile
import unittest
from contextlib import closing
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient
from python_progress import init_progress_schema, install_progress_routes


class PythonProgressTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / 'test.sqlite'
        def open_db():
            db = sqlite3.connect(self.path)
            db.row_factory = sqlite3.Row
            return db
        self.open_db = open_db
        with closing(open_db()) as db:
            db.execute('CREATE TABLE users (id INTEGER PRIMARY KEY)')
            db.executemany('INSERT INTO users VALUES (?)', [(1,), (2,)])
            init_progress_schema(db)
            db.commit()
        app = FastAPI()
        install_progress_routes(app, open_db, lambda request: {'id': int(request.headers['x-test-user'])} if request.headers.get('x-test-user') else None)
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        self.tmp.cleanup()

    def save(self, user=1, task='task-001', **changes):
        return self.client.patch(f'/api/python-progress/1/{task}', headers={'x-test-user': str(user)}, json={'user_id': user, 'version': 0, **changes})

    def test_authorization_and_account_isolation(self):
        self.assertEqual(self.client.get('/api/python-progress/1').status_code, 401)
        self.assertEqual(self.client.patch('/api/python-progress/1/task-001', json={'user_id': 1, 'version': 0, 'done': True}).status_code, 401)
        self.assertEqual(self.save(code='private', done=True).status_code, 200)
        self.assertEqual(self.client.get('/api/python-progress/1', headers={'x-test-user': '2'}).json()['tasks'], [])
        self.assertEqual(self.save(user=2, user_id=1, code='wrong account').status_code, 403)

    def test_restore_partial_updates_noop_and_empty_code(self):
        first = self.save(code='print("Привет")', done=True).json()['task']
        self.assertEqual(first['version'], 1)
        same = self.save(version=1, code=first['code'], done=True).json()['task']
        self.assertEqual(same['version'], 1)
        changed = self.save(version=1, done=False).json()['task']
        self.assertEqual(changed['code'], first['code'])
        self.assertEqual(changed['done'], 0)
        cleared = self.save(version=2, code='').json()['task']
        self.assertEqual(cleared['code'], '')
        restored = self.client.get('/api/python-progress/1', headers={'x-test-user': '1'}).json()['tasks']
        self.assertEqual(restored[0]['version'], 3)

    def test_conflict_does_not_overwrite_newer_work(self):
        self.save(code='newer')
        stale = self.save(code='stale')
        self.assertEqual(stale.status_code, 409)
        self.assertEqual(stale.json()['current']['code'], 'newer')
        self.assertEqual(self.save(version=1, code='resolved').status_code, 200)
        self.assertEqual(self.save(task='task-002', code='independent').status_code, 200)

    def test_bounded_code_and_keys(self):
        self.assertEqual(self.save(code='я' * 20000).status_code, 413)
        self.assertEqual(self.save(code='a' * 32769).status_code, 422)
        self.assertEqual(self.save(task='not-a-task', code='x').status_code, 404)
        self.assertEqual(self.client.get('/api/python-progress/18', headers={'x-test-user': '1'}).status_code, 404)
        self.assertEqual(self.save().status_code, 400)

    def test_real_startup_migration_preserves_existing_user_and_progress(self):
        # Run the real startup migration with an isolated DB and no cloud/env configuration.
        source = ast.parse(Path(__file__).with_name('server.py').read_text(encoding='utf-8'))
        migration = next(node for node in source.body if isinstance(node, ast.FunctionDef) and node.name == 'init_db')
        migration_path = Path(self.tmp.name) / 'migration.sqlite'
        def open_migration_db():
            db = sqlite3.connect(migration_path)
            db.row_factory = sqlite3.Row
            return db
        namespace = {'sqlite3': sqlite3, 'closing': closing, 'open_db': open_migration_db,
                     'os': SimpleNamespace(environ={}), 'SUPERADMIN_EMAIL': 'admin@example.test'}
        exec(compile(ast.Module(body=[migration], type_ignores=[]), 'isolated-migration', 'exec'), namespace)
        namespace['init_db']()
        with closing(open_migration_db()) as db:
            db.execute("INSERT INTO users (username,password_hash,display_name) VALUES ('student@example.test','unchanged','Student')")
            db.execute("INSERT INTO python_task_progress VALUES (1,1,'task-001','saved',1,1,'now')")
            db.commit()
        namespace['init_db']()
        with closing(open_migration_db()) as db:
            self.assertEqual(db.execute('SELECT password_hash FROM users').fetchone()[0], 'unchanged')
            self.assertEqual(db.execute('SELECT code FROM python_task_progress').fetchone()[0], 'saved')


if __name__ == '__main__':
    unittest.main()
