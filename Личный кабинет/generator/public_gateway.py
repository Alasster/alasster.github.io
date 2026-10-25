"""Student-only entry point for an HTTPS tunnel. Teacher APIs stay on LAN."""
from fastapi.responses import HTMLResponse, JSONResponse


class StudentPublicGateway:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return
        path = scope.get('path', '')
        if path == '/':
            response = HTMLResponse(
                '<!doctype html><html lang="ru"><meta charset="utf-8">'
                '<meta name="viewport" content="width=device-width,initial-scale=1">'
                '<title>Бағалау</title><body style="font:18px sans-serif;padding:2rem">'
                '<h1>Бағалау</h1><p>Сервер доступен. Откройте ссылку на работу, '
                'которую выдал учитель.</p></body></html>')
            await response(scope, receive, send)
            return
        allowed = (
            path == '/api/health'
            or path.startswith('/exam/')
            or path.startswith('/api/student/')
            or path.startswith('/static/')
            or path.startswith('/generator/exam/')
            or path.startswith('/generator/api/student/')
            or path.startswith('/generator/static/')
            or path == '/generator/api/health'
        )
        if not allowed:
            await JSONResponse({'detail': 'Доступен только вход ученика'}, status_code=404)(scope, receive, send)
            return
        await self.app(scope, receive, send)
