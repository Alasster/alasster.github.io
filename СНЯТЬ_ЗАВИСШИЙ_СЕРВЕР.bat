@echo off
cd /d "%~dp0"
echo Запрос прав администратора для снятия зависшего процесса...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/c taskkill /f /im python.exe & echo. & echo [OK] Зависший процесс Python успешно снят! Порты 8010 и 8001 свободны. & timeout /t 3' -Verb RunAs"

