"""Minimal Google Drive REST client (no extra dependencies) used by the cloud (Render) server
to store generated KSP files in Мой диск/КСП/2026–2027/<класс>/<четверть>/ as native Google Docs.

Required env vars (see Настроить_Google_Диск.py):
    GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN
Optional:
    KSP_DRIVE_ROOT_NAME (default «КСП»), KSP_DRIVE_ROOT_FOLDER_ID
"""
from __future__ import annotations

import json
import os
import threading
import time

import httpx

GDOC_MIME = 'application/vnd.google-apps.document'
FOLDER_MIME = 'application/vnd.google-apps.folder'
DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
API = 'https://www.googleapis.com/drive/v3'
UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'


def configured() -> bool:
    return all(os.environ.get(k, '').strip() for k in (
        'GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_SECRET', 'GOOGLE_DRIVE_REFRESH_TOKEN'))


class DriveClient:
    def __init__(self):
        self._token = ''
        self._exp = 0.0
        self._lock = threading.Lock()
        self._folders: dict[tuple, str] = {}
        self._http = httpx.Client(timeout=httpx.Timeout(120.0, connect=15.0))

    # ---- auth -------------------------------------------------------------------------
    def token(self) -> str:
        with self._lock:
            if self._token and time.time() < self._exp - 60:
                return self._token
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
        return self._folder(os.environ.get('KSP_DRIVE_ROOT_NAME', 'КСП').strip() or 'КСП', 'root')

    def ensure_path(self, parts: list[str]) -> str:
        cur = self.root_id()
        for part in parts:
            cur = self._folder(part, cur)
        return cur

    # ---- files ------------------------------------------------------------------------
    def upload_docx_as_gdoc(self, local_file, parts: list[str], title: str) -> str:
        """Upload .docx converted to a native Google Doc. Replaces content if it already exists."""
        parent = self.ensure_path(parts)
        with open(local_file, 'rb') as f:
            blob = f.read()
        existing = self._find(title, parent, GDOC_MIME)
        boundary = 'ksp' + str(int(time.time() * 1000))
        if existing:
            meta = {}
            url = f"{UPLOAD}/{existing['id']}?uploadType=multipart&supportsAllDrives=true"
            method = 'PATCH'
        else:
            meta = {'name': title, 'mimeType': GDOC_MIME, 'parents': [parent]}
            url = f'{UPLOAD}?uploadType=multipart&supportsAllDrives=true'
            method = 'POST'
        body = (
            f'--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'
            f'{json.dumps(meta, ensure_ascii=False)}\r\n'
            f'--{boundary}\r\nContent-Type: {DOCX_MIME}\r\n\r\n'
        ).encode('utf-8') + blob + f'\r\n--{boundary}--'.encode('utf-8')
        r = self._req(method, url, content=body,
                      headers={'Content-Type': f'multipart/related; boundary={boundary}'})
        return r.json()['id']

    def index_docs(self) -> dict[tuple, str]:
        """Map (класс, четверть, название документа) -> doc id for every KSP Google Doc under КСП/2026–2027."""
        year = self.ensure_path(['2026–2027'])
        result: dict[tuple, str] = {}
        classes = self._list_children(year, FOLDER_MIME)
        for cls in classes:
            for quarter in self._list_children(cls['id'], FOLDER_MIME):
                for doc in self._list_children(quarter['id'], GDOC_MIME):
                    result[(cls['name'], quarter['name'], doc['name'])] = doc['id']
        return result

    def _list_children(self, parent: str, mime: str) -> list[dict]:
        out, token = [], None
        while True:
            params = {
                'q': f"'{parent}' in parents and mimeType='{mime}' and trashed=false",
                'fields': 'nextPageToken,files(id,name)', 'pageSize': 200,
                'supportsAllDrives': 'true', 'includeItemsFromAllDrives': 'true'}
            if token:
                params['pageToken'] = token
            data = self._req('GET', f'{API}/files', params=params).json()
            out += data.get('files', [])
            token = data.get('nextPageToken')
            if not token:
                return out
