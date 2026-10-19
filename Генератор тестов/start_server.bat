@echo off
chcp 65001 > nul
cd /d "%~dp0"
title Бағалау — Веб-сервис СОР и СОЧ

echo =========================================================================
echo    Запуск веб-сервиса «Бағалау» для проведения СОР и СОЧ
echo =========================================================================
echo.

:: 1. Проверяем наличие Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Python не обнаружен на этом компьютере!
    echo Пожалуйста, установите Python с сайта https://www.python.org/
    echo При установке обязательно отметьте галочку: Add python.exe to PATH.
    echo.
    pause
    exit /b 1
)

:: 2. Проверяем наличие библиотек
python -c "import fastapi, uvicorn, aiosqlite, openpyxl, multipart" >nul 2>nul
if %errorlevel% neq 0 (
    echo [ИНФО] Первый запуск на этом компьютере.
    echo Установка необходимых модулей...
    python -m pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Не удалось установить модули. Проверьте подключение к интернету.
        pause
        exit /b 1
    )
    echo [УСПЕХ] Все модули успешно установлены!
    echo.
)

:: 3. Запуск сервера
echo Сервер запускается на:          http://127.0.0.1:8000
echo Адрес для учеников (в школе):   http://192.168.21.1:8000
echo Кабинет учителя:                http://127.0.0.1:8000/teacher
echo Вход по умолчанию:              логин: teacher / пароль: bagalau2026
echo.
echo Для остановки сервера закройте это окно.
echo =========================================================================
echo.

where python3.13 >nul 2>nul
if %errorlevel% equ 0 (
    python3.13 server.py
) else (
    python server.py
)
if %errorlevel% neq 0 (
    echo.
    echo [ВНИМАНИЕ] Сервер завершил работу с ошибкой.
)
pause
