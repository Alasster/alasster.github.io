@echo off
chcp 65001 > nul
cd /d "%~dp0"
title Открытие сетевого доступа к серверу Бағалау

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Запрос прав администратора для открытия порта 8000...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo Разрешаем доступ к порту 8000 в Брандмауэре Windows...
netsh advfirewall firewall add rule name="Bagalau Server 8000" dir=in action=allow protocol=TCP localport=8000 profile=any
powershell -Command "Set-NetConnectionProfile -InterfaceAlias Ethernet -NetworkCategory Private"

echo.
echo =========================================================================
echo    [УСПЕХ] Порт 8000 успешно открыт в Брандмауэре Windows!
echo    Сеть переведена в режим Частной сети.
echo    Теперь компьютеры и телефоны в школе могут подключаться к серверу!
echo =========================================================================
echo.
pause

