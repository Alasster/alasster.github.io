@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Bagalau - Phone Internet Access
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0enable_internet.ps1"
set "BAGALAU_EXIT_CODE=%ERRORLEVEL%"
echo.
pause
exit /b %BAGALAU_EXIT_CODE%
