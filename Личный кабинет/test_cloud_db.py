"""Transaction and failure regressions; no production data or network access."""
import json
import os
import sqlite3
import unittest
from unittest.mock import patch

import httpx
from cloud_db import Connection, _decode, _encode


class CloudTransactions(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, TURSO_CABINET_URL='libsql://test.turso.io', TURSO_CABINET_TOKEN='test-only')
        self.env.start()
        self.db = sqlite3.connect(':memory:')
        self.requests = []

        def respond(request):
            payload = json.loads(request.content)
            self.requests.append(payload)
            results = []
            for operation in payload['requests']:
                if operation['type'] == 'close':
                    self.db.rollback()
                    results.append({'type': 'ok', 'response': {'type': 'close'}})
                    continue
                statement = operation['stmt']
                try:
                    cursor = self.db.execute(statement['sql'], [_decode(v) for v in statement.get('args', [])])
                    results.append({'type': 'ok', 'response': {'type': 'execute', 'result': {
                        'cols': [{'name': c[0]} for c in cursor.description or []],
                        'rows': [[_encode(v) for v in row] for row in cursor.fetchall()],
                        'affected_row_count': cursor.rowcount,
                        'last_insert_rowid': str(cursor.lastrowid) if cursor.lastrowid else None}}})
                except sqlite3.Error as exc:
                    results.append({'type': 'error', 'error': {'code': exc.sqlite_errorname}})
            return httpx.Response(200, json={'baton': 'connection-test', 'results': results})

        self.client = httpx.Client(transport=httpx.MockTransport(respond))
        self.connection = Connection('CABINET', client=self.client)

    def tearDown(self):
        self.connection.close()
        self.db.close()
        self.env.stop()

    def test_commit_and_rollback_preserve_bound_values(self):
        self.connection.executescript('CREATE TABLE answers(id INTEGER PRIMARY KEY, value BLOB);')
        values = [None, 'Ответ; DROP TABLE answers;', 1234567890123456, 2.5, b'\x00\xff']
        for i, value in enumerate(values):
            self.connection.execute('INSERT INTO answers VALUES (?, ?)', (i, value))
        self.connection.commit()
        self.assertEqual([r['value'] for r in self.connection.execute('SELECT value FROM answers ORDER BY id')], values)
        self.connection.execute('UPDATE answers SET value = ?', ('changed',))
        self.connection.rollback()
        self.assertEqual(self.connection.execute('SELECT COUNT(*) AS n FROM answers').fetchone()['n'], 5)
        self.assertEqual(self.connection.execute('SELECT value FROM answers WHERE id = 0').fetchone()[0], None)

    def test_batch_answers_use_one_request_and_one_transaction(self):
        self.connection.execute('CREATE TABLE batch_answers(id INTEGER PRIMARY KEY, value TEXT)')
        before = len(self.requests)
        self.connection.executemany('INSERT INTO batch_answers VALUES(?,?)', [(i,str(i)) for i in range(30)])
        self.assertEqual(len(self.requests) - before, 2)
        self.connection.commit()
        self.assertEqual(self.connection.execute('SELECT COUNT(*) AS n FROM batch_answers').fetchone()['n'], 30)

    def test_constraint_error_does_not_commit_partial_work(self):
        self.connection.execute('CREATE TABLE attempts(id TEXT PRIMARY KEY)')
        self.connection.execute('INSERT INTO attempts VALUES (?)', ('one',))
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute('INSERT INTO attempts VALUES (?)', ('one',))
        self.connection.close()
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM attempts').fetchone()[0], 0)

    def test_write_transport_failure_is_not_retried(self):
        self.connection._transaction = True
        calls = []
        def unavailable(request):
            calls.append(request)
            raise httpx.ReadTimeout('secret must not appear in exception')
        self.connection._client.close()
        self.connection._client = httpx.Client(transport=httpx.MockTransport(unavailable))
        with self.assertRaisesRegex(sqlite3.OperationalError, 'no automatic write retry') as error:
            self.connection.execute('INSERT INTO answers VALUES (?, ?)', (1, 'private'))
        self.assertEqual(len(calls), 1)
        self.assertNotIn('private', str(error.exception))
        self.assertNotIn('secret', str(error.exception))
        self.connection._baton = None


if __name__ == '__main__':
    unittest.main()
