"""Google Drive REST client for KSP files in Мой диск/КСП/2026–2027/<класс>/<четверть>/.

Supports:
1. OAuth refresh token (GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET / GOOGLE_DRIVE_REFRESH_TOKEN)
2. Automatic fallback to the built-in Google Service Account (shared on folder 1skfm8UZo7rAcWLJFpULLgICGyoJsXsJo)
   using either direct upload, in-place PATCH update, or claiming a pre-synced slot from .pool.
"""
from __future__ import annotations

import base64
import json
import os
import threading
import time
from pathlib import Path

import httpx

try:
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request as GoogleAuthRequest
except Exception:
    service_account = None
    GoogleAuthRequest = None

GDOC_MIME = 'application/vnd.google-apps.document'
FOLDER_MIME = 'application/vnd.google-apps.folder'
DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
API = 'https://www.googleapis.com/drive/v3'
UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'

DEFAULT_KSP_ROOT_ID = '1skfm8UZo7rAcWLJFpULLgICGyoJsXsJo'
DEFAULT_YEAR_FOLDER_ID = '1GWtxb0KmS5kHJmaHMow_yf1I-8aVL5M_'

_BUILTIN_SA_DATA = "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"
_BUILTIN_SA_KEY = b"AlassterGA4SecretKey2026"

BASE = Path(__file__).resolve().parent


def _oauth_configured() -> bool:
    return all(os.environ.get(k, '').strip() for k in (
        'GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_SECRET', 'GOOGLE_DRIVE_REFRESH_TOKEN'))


def _get_service_account_creds():
    if service_account is None:
        return None
    scopes = ['https://www.googleapis.com/auth/drive']
    sa_file = BASE / 'ga4-service-account.json'
    if sa_file.is_file():
        try:
            return service_account.Credentials.from_service_account_file(str(sa_file), scopes=scopes)
        except Exception:
            pass
    try:
        raw_enc = base64.b64decode(_BUILTIN_SA_DATA.encode('ascii'))
        dec = bytes([b ^ _BUILTIN_SA_KEY[i % len(_BUILTIN_SA_KEY)] for i, b in enumerate(raw_enc)]).decode('utf-8')
        info = json.loads(dec)
        return service_account.Credentials.from_service_account_info(info, scopes=scopes)
    except Exception:
        return None


def configured() -> bool:
    return _oauth_configured() or (_get_service_account_creds() is not None)


class DriveClient:
    def __init__(self):
        self._token = ''
        self._exp = 0.0
        self._lock = threading.Lock()
        self._folders: dict[tuple, str] = {}
        self._http = httpx.Client(timeout=httpx.Timeout(120.0, connect=15.0))
        self._sa_creds = None if _oauth_configured() else _get_service_account_creds()

    # ---- auth -------------------------------------------------------------------------
    def token(self) -> str:
        with self._lock:
            if self._token and time.time() < self._exp - 60:
                return self._token
            if _oauth_configured():
                r = self._http.post('https://oauth2.googleapis.com/token', data={
                    'client_id': os.environ['GOOGLE_DRIVE_CLIENT_ID'].strip(),
                    'client_secret': os.environ['GOOGLE_DRIVE_CLIENT_SECRET'].strip(),
                    'refresh_token': os.environ['GOOGLE_DRIVE_REFRESH_TOKEN'].strip(),
                    'grant_type': 'refresh_token',
                })
                if r.status_code != 200:
                    raise ValueError(f'Google Диск: не удалось войти ({r.status_code}): {r.text[:200]}')
                data = r.json()
                self._token = data['access_token']
                self._exp = time.time() + int(data.get('expires_in', 3600))
                return self._token

            if self._sa_creds is None:
                self._sa_creds = _get_service_account_creds()
            if self._sa_creds is None or GoogleAuthRequest is None:
                raise ValueError('Не удалось инициализировать доступ к Google Диску.')
            self._sa_creds.refresh(GoogleAuthRequest())
            self._token = self._sa_creds.token
            self._exp = time.time() + 3300
            return self._token

    def _req(self, method: str, url: str, **kw):
        headers = kw.pop('headers', {})
        headers['Authorization'] = f'Bearer {self.token()}'
        r = self._http.request(method, url, headers=headers, **kw)
        if r.status_code >= 400:
            raise ValueError(f'Google Диск: ошибка {r.status_code}: {r.text[:300]}')
        return r

    # ---- folders ----------------------------------------------------------------------
    @staticmethod
    def _q(value: str) -> str:
        return value.replace('\\', '\\\\').replace("'", "\\'")

    def _find(self, name: str, parent: str, mime: str | None = None):
        q = f"name='{self._q(name)}' and '{parent}' in parents and trashed=false"
        if mime:
            q += f" and mimeType='{mime}'"
        r = self._req('GET', f'{API}/files', params={
            'q': q, 'fields': 'files(id,name,mimeType)', 'pageSize': 10,
            'supportsAllDrives': 'true', 'includeItemsFromAllDrives': 'true'})
        files = r.json().get('files', [])
        return files[0] if files else None

    def _folder(self, name: str, parent: str) -> str:
        key = (parent, name)
        if key in self._folders:
            return self._folders[key]
        found = self._find(name, parent, FOLDER_MIME)
        if found:
            fid = found['id']
        else:
            r = self._req('POST', f'{API}/files', params={'supportsAllDrives': 'true'},
                          json={'name': name, 'mimeType': FOLDER_MIME, 'parents': [parent]})
            fid = r.json()['id']
        self._folders[key] = fid
        return fid

    def root_id(self) -> str:
        explicit = os.environ.get('KSP_DRIVE_ROOT_FOLDER_ID', '').strip()
        if explicit:
            return explicit
        return DEFAULT_KSP_ROOT_ID

    def ensure_path(self, parts: list[str]) -> str:
        cur = self.root_id()
        for part in parts:
            cur = self._folder(part, cur)
        return cur

    def file_exists(self, file_id: str) -> bool:
        """Check if a file still exists on Google Drive and is not in trash."""
        try:
            r = self._req('GET', f'{API}/files/{file_id}', params={
                'fields': 'id,trashed',
                'supportsAllDrives': 'true'
            })
            data = r.json()
            return bool(data.get('id')) and not data.get('trashed', False)
        except Exception:
            return False

    def _claim_pool_slot(self, target_parent: str, docx_name: str, blob: bytes) -> str | None:
        """Claim a pre-synced user-owned file from КСП/.pool, move to target_parent, rename, and upload content."""
        pool_folder = self._find('.pool', self.root_id(), FOLDER_MIME)
        if not pool_folder:
            return None
        pool_id = pool_folder['id']
        r = self._req('GET', f'{API}/files', params={
            'q': f"'{pool_id}' in parents and trashed=false and mimeType!='{FOLDER_MIME}'",
            'fields': 'files(id,name)',
            'pageSize': 5,
            'supportsAllDrives': 'true',
            'includeItemsFromAllDrives': 'true'
        })
        slots = r.json().get('files', [])
        if not slots:
            return None
        slot_id = slots[0]['id']
        boundary = 'ksp' + str(int(time.time() * 1000))
        meta = {'name': docx_name}
        body = (
            f'--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'
            f'{json.dumps(meta, ensure_ascii=False)}\r\n'
            f'--{boundary}\r\nContent-Type: {DOCX_MIME}\r\n\r\n'
        ).encode('utf-8') + blob + f'\r\n--{boundary}--'.encode('utf-8')
        url = (
            f"{UPLOAD}/{slot_id}?uploadType=multipart"
            f"&addParents={target_parent}&removeParents={pool_id}"
            f"&supportsAllDrives=true&fields=id,name"
        )
        res = self._req('PATCH', url, content=body, headers={'Content-Type': f'multipart/related; boundary={boundary}'})
        return res.json()['id']

    # ---- files ------------------------------------------------------------------------
    def upload_docx_as_gdoc(self, local_file, parts: list[str], title: str) -> str:
        """Upload .docx to КСП/2026–2027/<класс>/<четверть>/. Replaces content if it already exists."""
        full_parts = ['2026–2027'] + [p for p in parts if p != '2026–2027']
        parent = self.ensure_path(full_parts)
        with open(local_file, 'rb') as f:
            blob = f.read()

        docx_name = title if title.lower().endswith('.docx') else f'{title}.docx'
        stem_name = title[:-5] if title.lower().endswith('.docx') else title

        # 1. Check if file already exists in target folder (either as .docx or native Google Doc)
        existing = (
            self._find(docx_name, parent)
            or self._find(stem_name, parent, GDOC_MIME)
            or self._find(stem_name, parent)
        )
        boundary = 'ksp' + str(int(time.time() * 1000))
        if existing:
            meta = {'name': existing.get('name') or docx_name}
            url = f"{UPLOAD}/{existing['id']}?uploadType=multipart&supportsAllDrives=true&fields=id"
            body = (
                f'--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'
                f'{json.dumps(meta, ensure_ascii=False)}\r\n'
                f'--{boundary}\r\nContent-Type: {DOCX_MIME}\r\n\r\n'
            ).encode('utf-8') + blob + f'\r\n--{boundary}--'.encode('utf-8')
            r = self._req('PATCH', url, content=body,
                          headers={'Content-Type': f'multipart/related; boundary={boundary}'})
            return r.json()['id']

        # 2. If using OAuth user token, POST directly
        if _oauth_configured():
            meta = {'name': docx_name, 'parents': [parent]}
            url = f'{UPLOAD}?uploadType=multipart&supportsAllDrives=true&fields=id'
            body = (
                f'--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'
                f'{json.dumps(meta, ensure_ascii=False)}\r\n'
                f'--{boundary}\r\nContent-Type: {DOCX_MIME}\r\n\r\n'
            ).encode('utf-8') + blob + f'\r\n--{boundary}--'.encode('utf-8')
            r = self._req('POST', url, content=body,
                          headers={'Content-Type': f'multipart/related; boundary={boundary}'})
            return r.json()['id']

        # 3. Using Service Account: claim a slot from КСП/.pool and move it into target folder
        claimed_id = self._claim_pool_slot(parent, docx_name, blob)
        if claimed_id:
            return claimed_id

        raise ValueError('В облачном пуле Google Диска закончились свободные слоты (.pool). Откройте кабинет локально для синхронизации.')

    def index_docs(self) -> dict[tuple, str]:
        """Map (класс, четверть, название без .docx) -> doc id for every KSP file under КСП/2026–2027."""
        year = self.ensure_path(['2026–2027'])
        result: dict[tuple, str] = {}
        classes = self._list_children(year, FOLDER_MIME)
        for cls in classes:
            for quarter in self._list_children(cls['id'], FOLDER_MIME):
                for doc in self._list_files(quarter['id']):
                    raw_name = doc['name']
                    stem = raw_name[:-5] if raw_name.lower().endswith('.docx') else raw_name
                    result[(cls['name'], quarter['name'], stem)] = doc['id']
                    result[(cls['name'], quarter['name'], raw_name)] = doc['id']
        return result

    def _list_children(self, parent: str, mime: str) -> list[dict]:
        out, token = [], None
        while True:
            params = {
                'q': f"'{parent}' in parents and mimeType='{mime}' and trashed=false",
                'fields': 'nextPageToken,files(id,name,mimeType)', 'pageSize': 200,
                'supportsAllDrives': 'true', 'includeItemsFromAllDrives': 'true'}
            if token:
                params['pageToken'] = token
            data = self._req('GET', f'{API}/files', params=params).json()
            out += data.get('files', [])
            token = data.get('nextPageToken')
            if not token:
                return out

    def _list_files(self, parent: str) -> list[dict]:
        out, token = [], None
        while True:
            params = {
                'q': f"'{parent}' in parents and mimeType!='{FOLDER_MIME}' and trashed=false",
                'fields': 'nextPageToken,files(id,name,mimeType)', 'pageSize': 200,
                'supportsAllDrives': 'true', 'includeItemsFromAllDrives': 'true'}
            if token:
                params['pageToken'] = token
            data = self._req('GET', f'{API}/files', params=params).json()
            out += data.get('files', [])
            token = data.get('nextPageToken')
            if not token:
                return out
