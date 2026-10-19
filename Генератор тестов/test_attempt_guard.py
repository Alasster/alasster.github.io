"""Registration/retake regressions against a fresh temporary database only.

Run: python -m unittest test_attempt_guard -v
"""
import asyncio
from datetime import datetime, timedelta, timezone
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import httpx

import database
import server


class AttemptGuardTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="bagalau-attempt-guard-")
        self.db_patch = patch.multiple(database, DB_DIR=self.temp.name,
                                      DB_PATH=str(Path(self.temp.name) / "bagalau.sqlite3"))
        self.db_patch.start()
        await database.init_db()
        self.clients = []
        self.teacher_client = self.client("127.0.0.1")
        login = await self.teacher_client.post("/api/teacher/login", json={
            "username": "teacher", "password": "bagalau2026"})
        self.teacher_token = login.json()["token"]
        self.teacher_headers = {"Authorization": "Bearer " + self.teacher_token}
        work = await self.teacher_client.post("/api/tests", headers=self.teacher_headers, json={
            "title": "Isolated guard regression", "subject": "Test", "grade_level": "10"})
        self.test_id = work.json()["id"]
        self.task_ids = []
        for variant in ("1", "2"):
            task = await self.teacher_client.post(f'/api/tests/{work.json()["id"]}/tasks',
                headers=self.teacher_headers, json={"question_text": "2 + 2", "question_type": "number",
                    "max_score": 1, "answer_key": 4, "variant": variant})
            self.task_ids.append(task.json()["id"])
        launch = await self.teacher_client.post("/api/launches", headers=self.teacher_headers,
            json={"test_id": work.json()["id"], "allowed_classes": ["10 А"], "duration_minutes": 45})
        self.launch = launch.json()["launch_id"]
        await self.teacher_client.put(f"/api/launches/{self.launch}/status",
            headers=self.teacher_headers, json={"status": "active"})

    async def asyncTearDown(self):
        for client in self.clients:
            await client.aclose()
        server.TEACHER_SESSIONS.pop(self.teacher_token, None)
        self.db_patch.stop()
        self.temp.cleanup()

    def client(self, ip):
        client = httpx.AsyncClient(transport=httpx.ASGITransport(app=server.app, client=(ip, 1234)),
                                   base_url="http://exam.test")
        self.clients.append(client)
        return client

    async def join(self, client, name="Әлиев Арман", variant="1", student_class="10 А"):
        return await client.post(f"/api/student/join/{self.launch}", json={
            "student_name": name, "student_class": student_class, "variant": variant})

    async def age_attempts(self, **fields):
        async with database.get_db() as db:
            for field, value in fields.items():
                assert field in ("created_at", "started_at", "submitted_at")
                await db.execute(f"UPDATE student_attempts SET {field} = ?", (value,))
            await db.commit()

    async def test_resume_preserves_answers_deadline_and_submitted_receipt(self):
        student = self.client("192.0.2.1")
        first = (await self.join(student)).json()
        headers = {"X-Attempt-Token": first["attempt_token"]}
        await student.post("/api/student/start", headers=headers)
        await student.post("/api/student/save", headers=headers, json={
            "task_id": self.task_ids[0], "answer": 4, "version": 1})
        before = (await student.get("/api/student/attempt", headers=headers)).json()
        repeated = await self.join(student)
        self.assertEqual(repeated.json()["attempt_id"], first["attempt_id"])
        after = (await student.get("/api/student/attempt", headers=headers)).json()
        self.assertEqual(before["server_deadline"], after["server_deadline"])
        self.assertEqual(before["answers"], after["answers"])
        result = await student.post("/api/student/submit", headers=headers, json={"answers": {self.task_ids[0]: 4}})
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual((await self.join(student, variant="2")).status_code, 409)
        self.assertEqual((await self.join(student)).json()["status"], "submitted")
        again = await student.post("/api/student/submit", headers=headers, json={"answers": {self.task_ids[0]: 999}})
        self.assertEqual(result.json()["confirmation_code"], again.json()["confirmation_code"])
        self.assertEqual(result.json()["total_score"], again.json()["total_score"])
        async with database.get_db() as db:
            row = await (await db.execute("SELECT COUNT(*) AS n FROM student_attempts")).fetchone()
            self.assertEqual(row["n"], 1)

    async def test_guard_survives_logout_and_identity_block_survives_cooldown(self):
        student = self.client("192.0.2.2")
        await self.join(student)
        student.cookies.delete("bagalau_student_token")  # same action as logout
        self.assertEqual((await self.join(student, variant="2")).status_code, 409)
        self.assertEqual((await self.join(student, name="Подменённое имя")).status_code, 409)
        await self.age_attempts(created_at=(datetime.now() - timedelta(days=2)).isoformat())
        clean_browser = self.client("192.0.2.200")  # no cookies, different IP, Cyrillic case/spacing
        duplicate = await self.join(clean_browser, name="  ӘЛИЕВ   АРМАН ", student_class="10 а")
        self.assertEqual(duplicate.status_code, 409, duplicate.text)

    async def test_shared_ip_requires_teacher_and_has_no_task_access(self):
        first = self.client("198.51.100.1")
        await self.join(first)
        second = self.client("198.51.100.1")
        joined = (await self.join(second, name="Другой ученик", variant="2")).json()
        self.assertEqual(joined["status"], "waiting_approval")
        headers = {"X-Attempt-Token": joined["attempt_token"]}
        attempt = (await second.get("/api/student/attempt", headers=headers)).json()
        self.assertEqual(attempt["tasks"], [])
        for endpoint, payload in (("start", {}), ("submit", {}), ("batch_save", {"answers": []}),
                                  ("save", {"task_id": self.task_ids[1], "answer": 4, "version": 1})):
            self.assertEqual((await second.post("/api/student/" + endpoint, headers=headers, json=payload)).status_code, 403)
        # Expiry does not silently admit an already suspicious registration.
        await self.age_attempts(created_at=(datetime.now(timezone.utc) - timedelta(minutes=21)).isoformat())
        self.assertEqual((await second.post("/api/student/start", headers=headers)).status_code, 403)
        admitted = await self.teacher_client.post(
            f'/api/launches/{self.launch}/students/{joined["attempt_id"]}/action',
            headers=self.teacher_headers, json={"action": "admit"})
        self.assertEqual(admitted.status_code, 200)
        self.assertEqual((await second.post("/api/student/start", headers=headers)).status_code, 200)
        visible = (await second.get("/api/student/attempt", headers=headers)).json()
        self.assertEqual([t["id"] for t in visible["tasks"]], [self.task_ids[1]])

    async def test_twenty_minute_boundary_and_recent_submission(self):
        await self.join(self.client("203.0.113.1"))
        old = (datetime.now() - timedelta(minutes=21)).isoformat()
        await self.age_attempts(created_at=old)
        next_student = await self.join(self.client("203.0.113.1"), name="Следующий ученик")
        self.assertEqual(next_student.json()["status"], "approved")
        await self.age_attempts(created_at=old, submitted_at=datetime.now(timezone.utc).isoformat())
        recent = await self.join(self.client("203.0.113.1"), name="Ещё один ученик")
        self.assertEqual(recent.json()["status"], "waiting_approval")
        now = datetime.now(timezone.utc)
        for minutes, expected in ((19, True), (20, False), (21, False)):
            row = {"ip_address": "203.0.113.2", "created_at": (now - timedelta(minutes=minutes)).isoformat(),
                   "started_at": None, "submitted_at": None}
            self.assertEqual(server.recent_attempt_from_ip(row, "203.0.113.2", now), expected)

    async def test_teacher_delete_grants_immediate_retake_even_with_shared_ip(self):
        student = self.client("198.51.100.2")
        joined = (await self.join(student)).json()
        other = await self.join(self.client("198.51.100.2"), name="Сосед по Wi-Fi")
        self.assertEqual(other.json()["status"], "waiting_approval")
        # An unauthenticated request cannot delete the original attempt.
        path = f'/api/launches/{self.launch}/students/{joined["attempt_id"]}'
        self.assertEqual((await student.delete(path)).status_code, 401)
        deleted = await self.teacher_client.delete(path, headers=self.teacher_headers)
        self.assertEqual(deleted.status_code, 200)
        retake = await self.join(student, variant="2")
        self.assertEqual(retake.status_code, 200, retake.text)
        self.assertEqual(retake.json()["status"], "approved")
        self.assertNotEqual(retake.json()["attempt_id"], joined["attempt_id"])
        self.assertEqual((await student.get("/api/student/attempt", headers={
            "X-Attempt-Token": joined["attempt_token"]})).status_code, 401)
        self.assertEqual((await self.join(student, variant="1")).status_code, 409)
        async with database.get_db() as db:
            row = await (await db.execute("SELECT action FROM audit_logs WHERE action = 'student_retake_used'")).fetchone()
            self.assertIsNotNone(row)

    async def test_racing_joins_and_extra_permission_create_only_one_attempt(self):
        clients = [self.client("203.0.113.8") for _ in range(8)]
        responses = await asyncio.gather(*(self.join(c, variant=str(i % 2 + 1)) for i, c in enumerate(clients)))
        self.assertEqual(sum(r.status_code == 200 for r in responses), 1)
        joined = next(r.json() for r in responses if r.status_code == 200)
        action_path = f'/api/launches/{self.launch}/students/{joined["attempt_id"]}/action'
        await self.teacher_client.post(action_path, headers=self.teacher_headers,
                                       json={"action": "allow_extra_attempt"})
        clean = [self.client("203.0.113.9") for _ in range(8)]
        responses = await asyncio.gather(*(self.join(c, variant="2") for c in clean))
        self.assertEqual(sum(r.status_code == 200 for r in responses), 1)
        async with database.get_db() as db:
            row = await (await db.execute("SELECT COUNT(*) AS n FROM student_attempts")).fetchone()
            self.assertEqual(row["n"], 2)

    async def test_delete_cannot_target_attempt_in_another_launch(self):
        student = self.client("203.0.113.12")
        joined = (await self.join(student)).json()
        other = await self.teacher_client.post("/api/launches", headers=self.teacher_headers,
            json={"test_id": self.test_id, "allowed_classes": ["10 А"]})
        other_launch = other.json()["launch_id"]
        wrong = await self.teacher_client.delete(
            f'/api/launches/{other_launch}/students/{joined["attempt_id"]}', headers=self.teacher_headers)
        self.assertEqual(wrong.status_code, 404)
        self.assertEqual((await student.get("/api/student/attempt")).status_code, 200)


if __name__ == "__main__":
    unittest.main()
