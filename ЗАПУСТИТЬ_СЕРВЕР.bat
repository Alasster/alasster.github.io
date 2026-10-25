@echo off
cd /d "%~dp0"
title Alasster Unified Server
chcp 65001 >nul

taskkill /F /IM python.exe >nul 2>&1
timeout /t 1 /nobreak >nul

set "PYTHON="
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set "PYTHON=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if not defined PYTHON (
    for %%V in (Python313 Python312 Python311 Python310) do (
        if not defined PYTHON if exist "%LOCALAPPDATA%\Programs\Python\%%V\python.exe" set "PYTHON=%LOCALAPPDATA%\Programs\Python\%%V\python.exe"
    )
)
if not defined PYTHON (
    for %%V in (Python313 Python312 Python311 Python310) do (
        if not defined PYTHON if exist "%ProgramFiles%\Python\%%V\python.exe" set "PYTHON=%ProgramFiles%\Python\%%V\python.exe"
        if not defined PYTHON if exist "%ProgramFiles%\%%V\python.exe" set "PYTHON=%ProgramFiles%\%%V\python.exe"
        if not defined PYTHON if exist "C:\%%V\python.exe" set "PYTHON=C:\%%V\python.exe"
    )
)
if not defined PYTHON (
    python --version >nul 2>&1
    if not errorlevel 1 set "PYTHON=python"
)

if not defined PYTHON (
    echo [ERROR] Python 3.10+ not found!
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

"%PYTHON%" run.py

echo.
echo Server has stopped.
pause
