"""Одноразовая настройка доступа Render к вашему Google Диску.

1. https://console.cloud.google.com/ -> создайте проект -> «APIs & Services» -> Library -> включите «Google Drive API».
2. «OAuth consent screen»: тип External, добавьте свою почту; затем нажмите «Publish app» (статус In production),
   иначе токен перестанет работать через 7 дней.
3. «Credentials» -> Create credentials -> OAuth client ID -> тип «Desktop app». Скачайте JSON и сохраните
   рядом с этим файлом как client_secret.json.
4. Запустите:  python Настроить_Google_Диск.py   и войдите в свой Google-аккаунт.
5. Скрипт напечатает 3 значения - добавьте их в Render (Environment) и в Личный кабинет/.env.
   Также в Render добавьте GEMINI_API_KEY.
"""
import json
import sys
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse

import httpx

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

secret_file = Path(__file__).resolve().parent / 'client_secret.json'
if not secret_file.is_file():
    sys.exit('Не найден client_secret.json рядом со скриптом (см. инструкцию в начале файла).')

data = json.loads(secret_file.read_text(encoding='utf-8'))
cfg = data.get('installed') or data.get('web')
client_id, client_secret = cfg['client_id'], cfg['client_secret']

result = {}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        result['code'] = (q.get('code') or [''])[0]
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write('<h2>Готово. Можно закрыть вкладку и вернуться в терминал.</h2>'.encode('utf-8'))

    def log_message(self, *a):
        pass


server = HTTPServer(('127.0.0.1', 0), Handler)
redirect = f'http://127.0.0.1:{server.server_port}'
url = 'https://accounts.google.com/o/oauth2/v2/auth?' + urlencode({
    'client_id': client_id, 'redirect_uri': redirect, 'response_type': 'code',
    'scope': 'https://www.googleapis.com/auth/drive', 'access_type': 'offline', 'prompt': 'consent'})
print('Открываю браузер для входа в Google…')
webbrowser.open(url)
threading.Thread(target=server.handle_request, daemon=True).start()
while 'code' not in result:
    time.sleep(0.3)

r = httpx.post('https://oauth2.googleapis.com/token', data={
    'code': result['code'], 'client_id': client_id, 'client_secret': client_secret,
    'redirect_uri': redirect, 'grant_type': 'authorization_code'})
tok = r.json()
if 'refresh_token' not in tok:
    sys.exit(f'Не удалось получить refresh_token: {tok}')

print('\n=== Добавьте в Render -> Environment (и в Личный кабинет/.env) ===')
print(f'GOOGLE_DRIVE_CLIENT_ID={client_id}')
print(f'GOOGLE_DRIVE_CLIENT_SECRET={client_secret}')
print(f"GOOGLE_DRIVE_REFRESH_TOKEN={tok['refresh_token']}")
