# Личный кабинет

Автономный модуль. Он не подключён к корневому `index.html`, к папке «Генератор тестов» и к маршрутам основного сайта.

В кабинете есть регистрация по имени, фамилии, email и паролю. Email используется как логин; подтверждение по SMS не требуется. Адрес `alasster@yandex.ru` получает роль супер-админа, а новые пользователи — роль `user`. Супер-админ может назначать роли `user`, `teacher`, `admin` и `superadmin` в кабинете.

## Запуск в PowerShell

Из этой папки задайте учётную запись через переменные окружения и запустите сервер:

```powershell
python -m pip install -r requirements.txt
$env:PERSONAL_CABINET_ADMIN_USERNAME = "your-login"
$env:PERSONAL_CABINET_ADMIN_PASSWORD = "your-password"
$env:PERSONAL_CABINET_ADMIN_NAME = "Ваше имя"
python server.py
```

После запуска откройте <http://127.0.0.1:8010/>.

Пароль не записывается в исходники: при первом запуске он превращается в PBKDF2-хеш и сохраняется в `data/cabinet.sqlite3`. Сессия хранится на сервере, а браузеру выдаётся только HttpOnly-cookie. Для публикации по HTTPS установите `PERSONAL_CABINET_SECURE_COOKIE=1`.
