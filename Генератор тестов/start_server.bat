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
if errorlevel 1 (
    echo [ОШИБКА] Python не обнаружен на этом компьютере!
    echo Пожалуйста, установите Python с сайта https://www.python.org/
    echo При установке обязательно отметьте галочку: "Add python.exe to PATH".
    echo.
    pause
    exit /b 1
)

:: 2. Проверяем наличие библиотек и автоматически доустанавливаем при первом запуске
python -c "import fastapi, uvicorn, aiosqlite, openpyxl, multipart" >nul 2>nul
if errorlevel 1 (
    echo [ИНФО] Первый запуск на этом компьютере.
    echo Установка необходимых модулей (FastAPI, Uvicorn, aiosqlite, openpyxl)...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ОШИБКА] Не удалось установить модули. Проверьте подключение к интернету.
        pause
        exit /b 1
    )
    echo [УСПЕХ] Все модули успешно установлены!
    echo.
)

:: 3. Запуск сервера
echo Сервер запускается на: http://127.0.0.1:8000
echo Кабинет учителя:      http://127.0.0.1:8000/teacher
echo Вход по умолчанию:    логин: teacher / пароль: bagalau2026
echo.
echo Для остановки сервера закройте это окно.
echo =========================================================================
echo.

python server.py
pause
