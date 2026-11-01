import sys, json
from pathlib import Path
from google.oauth2 import service_account
from google.auth.transport.requests import Request
import httpx

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sa_path = Path('Личный кабинет/ga4-service-account.json')
creds = service_account.Credentials.from_service_account_file(
    str(sa_path),
    scopes=['https://www.googleapis.com/auth/drive']
)
creds.refresh(Request())
headers = {'Authorization': f'Bearer {creds.token}'}

root_id = '1skfm8UZo7rAcWLJFpULLgICGyoJsXsJo'
year_id = '1GWtxb0KmS5kHJmaHMow_yf1I-8aVL5M_'

# List all children under 2026-2027
r = httpx.get(
    'https://www.googleapis.com/drive/v3/files',
    params={'q': f"'{year_id}' in parents and trashed=false", 'fields': 'files(id,name,mimeType)'},
    headers=headers
)
print("Under 2026-2027:", r.status_code, r.text)

for cls in r.json().get('files', []):
    r2 = httpx.get(
        'https://www.googleapis.com/drive/v3/files',
        params={'q': f"'{cls['id']}' in parents and trashed=false", 'fields': 'files(id,name,mimeType)'},
        headers=headers
    )
    for q in r2.json().get('files', []):
        r3 = httpx.get(
            'https://www.googleapis.com/drive/v3/files',
            params={'q': f"'{q['id']}' in parents and trashed=false", 'fields': 'files(id,name,mimeType)'},
            headers=headers
        )
        print(f"  {cls['name']} / {q['name']}:", [(f['name'], f['id'], f['mimeType']) for f in r3.json().get('files', [])])

# Test creating a temporary file in year_id
meta = {'name': '_test_upload.txt', 'parents': [year_id]}
boundary = '===test_boundary==='
body = (
    f'--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'
    + json.dumps(meta) +
    f'\r\n--{boundary}\r\nContent-Type: text/plain\r\n\r\nhello\r\n--{boundary}--\r\n'
).encode('utf-8')
up_r = httpx.post(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
    headers={**headers, 'Content-Type': f'multipart/related; boundary={boundary}'},
    content=body
)
print("Upload test:", up_r.status_code, up_r.text)
if up_r.status_code == 200:
    fid = up_r.json()['id']
    del_r = httpx.delete(f'https://www.googleapis.com/drive/v3/files/{fid}', headers=headers)
    print("Delete test:", del_r.status_code)

