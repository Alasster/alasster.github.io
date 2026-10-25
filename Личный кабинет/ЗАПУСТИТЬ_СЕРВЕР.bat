@echo off
chcp 65001 >nul
cd /d "%~dp0.."
title Единый сервер — Личный кабинет и Генератор тестов
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\run_server.ps1"
if %ERRORLEVEL% neq 0 (
    echo.
    echo Ошибка при запуске. Нажмите любую клавишу для закрытия...
    pause >nul
)
