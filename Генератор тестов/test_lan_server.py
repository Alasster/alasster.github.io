"""Real HTTP regression/load test. Uses a temporary database, never teacher data.

Run: python test_lan_server.py [LAN-IP]
"""
import concurrent.futures
import http.client
import json
import os
from pathlib import Path
import socket
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time
from unittest.mock import patch


def run():
    import server
    with patch('socket.gethostbyaddr', side_effect=AssertionError('Blocking DNS')):
        assert server.get_device_info('192.168.20.190') == '192.168.20.190'
    addresses = [(socket.AF_INET, 0, 0, '', (ip, 0)) for ip in
                 ('100.105.182.22', '127.0.0.1', '192.168.21.1', '169.254.1.1')]
    with tempfile.TemporaryDirectory() as mock_root, patch.object(server, 'BASE_DIR', mock_root):
        with patch.dict(os.environ, {'BAGALAU_PUBLIC_URL': ''}), patch('socket.getaddrinfo', return_value=addresses):
            assert server.get_teacher_network_urls()[0] == 'http://192.168.21.1:8000'
            (Path(mock_root) / '.runtime').mkdir()
            (Path(mock_root) / '.runtime/public_url.txt').write_text('https://school.example', encoding='utf-8')
            assert server.get_teacher_network_urls()[0] == 'https://school.example'
    print('PASS: LAN before VPN; student connections never wait for reverse DNS', flush=True)

    host = sys.argv[1] if len(sys.argv) > 1 else '127.0.0.1'
    with socket.socket() as sock:
        sock.bind(('0.0.0.0', 0))
        port = sock.getsockname()[1]
        with socket.socket() as student_socket:
            student_socket.bind(('127.0.0.1', 0))
            student_port = student_socket.getsockname()[1]
    connections = threading.local()
    def request(path, data=None, headers=None, method=None, expected=200):
        # Like a browser, each student reuses a connection to the teacher PC.
        if not hasattr(connections, 'http'):
            connections.http = http.client.HTTPConnection(host, port, timeout=40)
        raw = json.dumps(data, ensure_ascii=False).encode() if data is not None else None
        connections.http.request(method or ('POST' if data is not None else 'GET'), path,
            body=raw, headers={'Content-Type': 'application/json', **(headers or {})})
        response = connections.http.getresponse()
        status, body = response.status, response.read()
        assert status == expected, (path, status, body[:500])
        return json.loads(body)

    with tempfile.TemporaryDirectory(prefix='bagalau-lan-') as temp:
        env = {**os.environ, 'BAGALAU_DB_DIR': temp, 'BAGALAU_PORT': str(port),
               'BAGALAU_STUDENT_PORT': str(student_port), 'PYTHONIOENCODING': 'utf-8'}
        with open(Path(temp) / 'server.log', 'w+', encoding='utf-8') as log:
            process = subprocess.Popen([sys.executable, 'server.py'], cwd=Path(__file__).parent,
                                       env=env, stdout=log, stderr=log)
            try:
                for _ in range(100):
                    try:
                        if request('/api/health')['ok']:
                            break
                    except (OSError, AssertionError):
                        if process.poll() is not None:
                            log.seek(0)
                            raise AssertionError(log.read())
                        time.sleep(.1)
                else:
                    raise AssertionError('Server did not start')
                login = request('/api/teacher/login', {'username': 'teacher', 'password': 'bagalau2026'})
                teacher = {'Authorization': 'Bearer ' + login['token']}
                work = request('/api/tests', {'title': 'Isolated LAN test', 'subject': 'Test', 'grade_level': '10'}, teacher)
                tasks = []
                for i in range(4):
                    task = request(f'/api/tests/{work["id"]}/tasks', {
                        'question_text': f'2 + 2 ({i})', 'question_type': 'number',
                        'max_score': 1, 'answer_key': 4}, teacher)
                    tasks.append(task['id'])
                launch = request('/api/launches', {'test_id': work['id'], 'allowed_classes': ['10 А'],
                                                 'publish_scores': True}, teacher)['launch_id']
                request(f'/api/launches/{launch}/status', {'status': 'active'}, teacher, method='PUT')

                def student(index):
                    joined = request(f'/api/student/join/{launch}', {
                        'student_name': f'Тест ученик {index}', 'student_class': '10 А'})
                    headers = {'X-Attempt-Token': joined['attempt_token']}
                    # These simulated browsers share one IP, like students behind NAT.
                    if joined['status'] == 'waiting_approval':
                        request(f'/api/launches/{launch}/students/{joined["attempt_id"]}/action',
                                {'action': 'admit'}, teacher)
                    request('/api/student/start', {}, headers)
                    visible = request('/api/student/attempt', headers=headers)
                    assert len(visible['tasks']) == 4
                    assert all('answer_key' not in task for task in visible['tasks'])
                    request('/api/student/save', {'task_id': tasks[0], 'answer': 4, 'version': 1}, headers)
                    request('/api/student/batch_save', {'answers': [
                        {'task_id': task, 'answer': 4, 'version': 1} for task in tasks[1:]]}, headers)
                    request('/api/student/heartbeat', {}, headers)
                    submission = {'answers': {task: 4 for task in tasks}}
                    result = request('/api/student/submit', submission, headers)
                    assert result['total_score'] == 4 and result['completed_count'] == 4, result
                    repeated = request('/api/student/submit', {'answers': {tasks[0]: 999}}, headers)
                    assert repeated['confirmation_code'] == result['confirmation_code']
                    assert repeated['submitted_at'] == result['submitted_at']
                    assert repeated['total_score'] == 4
                    request('/api/student/save', {'task_id': tasks[0], 'answer': 999, 'version': 99}, headers, expected=403)
                    assert request('/api/student/results', headers=headers)['total_score'] == 4
                    return joined, headers

                start = time.perf_counter()
                with concurrent.futures.ThreadPoolExecutor(max_workers=32) as pool:
                    futures = [pool.submit(student, i) for i in range(30)]
                    while not all(f.done() for f in futures):
                        before = time.perf_counter()
                        assert request('/api/health')['ok']
                        request(f'/api/launches/{launch}/students', headers=teacher)
                        assert time.perf_counter() - before < 10, 'Server stalled during monitoring'
                        time.sleep(.1)
                    students = [f.result() for f in futures]
                rows = request(f'/api/launches/{launch}/students', headers=teacher)
                assert len(rows) == 30 and all(row['status'] == 'submitted' for row in rows)
                with sqlite3.connect(Path(temp) / 'bagalau.sqlite3') as db:
                    assert db.execute('SELECT COUNT(*) FROM student_answers').fetchone()[0] == 120
                    assert db.execute('SELECT SUM(final_score) FROM student_answers').fetchone()[0] == 120
                db.close()
                print(f'PASS: 30 concurrent students over {host}; 120 answers persisted; '
                      f'grading, retries, late saves and live monitoring ({time.perf_counter() - start:.1f}s)', flush=True)

                # A request exceeding the browser keepalive 64 KiB limit must submit.
                joined = request(f'/api/student/join/{launch}', {'student_name': 'Большой ответ', 'student_class': '10 А'})
                headers = {'X-Attempt-Token': joined['attempt_token']}
                if joined['status'] == 'waiting_approval':
                    request(f'/api/launches/{launch}/students/{joined["attempt_id"]}/action',
                            {'action': 'admit'}, teacher)
                request('/api/student/start', {}, headers)
                with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
                    payload = {'answers': {tasks[0]: 'ответ ' * 20000}}
                    a, b = [f.result() for f in [pool.submit(request, '/api/student/submit', payload, headers),
                                               pool.submit(request, '/api/student/submit', payload, headers)]]
                assert a['confirmation_code'] == b['confirmation_code']
                assert a['submitted_at'] == b['submitted_at']
                print('PASS: large submission and concurrent retries have one stable receipt', flush=True)
                gateway = http.client.HTTPConnection('127.0.0.1', student_port, timeout=5)
                for path, expected in [('/api/health', 200), (f'/exam/{launch}', 200),
                                       ('/static/js/student.js', 200), ('/teacher', 404),
                                       ('/api/tests', 404), ('/api/teacher/login', 404), ('/docs', 404)]:
                    gateway.request('GET', path)
                    response = gateway.getresponse()
                    assert response.status == expected, (path, response.status)
                    response.read()
                gateway.request('GET', '/api/student/results', headers=headers)
                response = gateway.getresponse()
                assert response.status == 200
                response.read()
                gateway.close()
                print('PASS: public gateway serves students and blocks teacher pages/APIs', flush=True)
            except Exception:
                log.flush()
                log.seek(0)
                print(log.read()[-6000:])
                raise
            finally:
                process.terminate()
                process.wait(timeout=15)


if __name__ == '__main__':
    run()
