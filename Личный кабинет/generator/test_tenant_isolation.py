"""Cross-owner and cross-launch regressions on disposable databases only."""
import unittest
from datetime import datetime

import database
import server
import test_attempt_guard as guard


class TenantIsolationTests(unittest.IsolatedAsyncioTestCase):
    asyncSetUp = guard.AttemptGuardTests.asyncSetUp
    asyncTearDown = guard.AttemptGuardTests.asyncTearDown
    client = guard.AttemptGuardTests.client
    join = guard.AttemptGuardTests.join

    async def test_other_teacher_cannot_read_modify_or_stream_work(self):
        async with database.get_db() as db:
            await db.execute('INSERT INTO teachers VALUES (?, ?, ?, ?, ?)',
                             ('owner-two', 'owner-two', server.hash_password('test-password'), 'Test teacher', datetime.now().isoformat()))
            await db.commit()
        second = self.client('127.0.0.1')
        login = await second.post('/api/teacher/login', json={'username':'owner-two','password':'test-password'})
        headers = {'Authorization':'Bearer ' + login.json()['token']}
        try:
            for path in [f'/api/tests/{self.test_id}', f'/api/launches/{self.launch}',
                         f'/api/launches/{self.launch}/students', f'/api/launches/{self.launch}/grading',
                         f'/api/launches/{self.launch}/stream']:
                response = await second.get(path, headers=headers)
                self.assertEqual(response.status_code, 404, path)
            response = await second.put(f'/api/launches/{self.launch}/status', headers=headers, json={'status':'finished'})
            self.assertEqual(response.status_code, 404)
            listed = await second.get('/api/tests', headers=headers)
            self.assertNotIn(self.test_id, listed.text)
        finally:
            server.TEACHER_SESSIONS.pop(login.json()['token'], None)

    async def test_grading_cannot_cross_launch_and_answers_cannot_cross_variant(self):
        student = self.client('192.0.2.40')
        attempt = (await self.join(student)).json()
        token = {'X-Attempt-Token': attempt['attempt_token']}
        self.assertEqual((await student.post('/api/student/start', headers=token)).status_code, 200)
        rejected = await student.post('/api/student/save', headers=token, json={
            'task_id':self.task_ids[1], 'answer':4, 'version':1})
        self.assertEqual(rejected.status_code, 400)
        valid = await student.post('/api/student/save', headers=token, json={
            'task_id':self.task_ids[0], 'answer':4, 'version':1})
        self.assertEqual(valid.status_code, 200)
        other = await self.teacher_client.post('/api/launches', headers=self.teacher_headers,
            json={'test_id':self.test_id, 'allowed_classes':['10 А'], 'duration_minutes':45})
        other_launch = other.json()['launch_id']
        rejected_grade = await self.teacher_client.post(f'/api/launches/{other_launch}/grade',
            headers=self.teacher_headers, json={'attempt_id':attempt['attempt_id'], 'task_id':self.task_ids[0], 'score':0})
        self.assertEqual(rejected_grade.status_code, 404)
        async with database.get_db() as db:
            row = await (await db.execute('SELECT answer_json, manual_score FROM student_answers WHERE attempt_id = ?', (attempt['attempt_id'],))).fetchone()
            self.assertEqual(row['answer_json'], '4')
            self.assertIsNone(row['manual_score'])
        public = await student.get(f'/api/student/check/{self.launch}')
        self.assertNotIn('answer_key', public.text)
        self.assertNotIn('snapshot_tasks_json', public.text)


if __name__ == '__main__':
    unittest.main()
