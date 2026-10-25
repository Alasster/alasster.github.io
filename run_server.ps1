[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Единый сервер — Личный кабинет и Генератор тестов"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "     ЕДИНЫЙ СЕРВЕР: ЛИЧНЫЙ КАБИНЕТ + ГЕНЕРАТОР ТЕСТОВ (СОР/СОЧ)       " -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Поиск интерпретатора Python
$pythonCandidates = @(
    "python",
    "py",
    "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
    "$env:ProgramFiles\Python313\python.exe",
    "$env:ProgramFiles\Python312\python.exe",
    "$env:ProgramFiles\Python311\python.exe",
    "$env:ProgramFiles\Python310\python.exe",
    "C:\Python312\python.exe",
    "C:\Python311\python.exe",
    "C:\Python310\python.exe"
)

$foundPython = $null
foreach ($cand in $pythonCandidates) {
    try {
        $ver = & $cand -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
        if ($ver -and ($ver -as [double]) -ge 3.10) {
            $foundPython = $cand
            break
        }
    } catch {
        continue
    }
}

if (-not $foundPython) {
    Write-Host "[ОШИБКА] Python 3.10+ не найден на этом компьютере!" -ForegroundColor Red
    Write-Host "Пожалуйста, скачайте и установите Python с сайта: https://www.python.org/" -ForegroundColor Yellow
    Write-Host "Обязательно включите галочку 'Add Python to PATH' при установке."
    Write-Host ""
    Read-Host "Нажмите Enter для выхода..."
    exit 1
}

Write-Host "[1/3] Python обнаружен: $foundPython" -ForegroundColor Green

# 2. Проверка библиотек
Write-Host "[2/3] Проверка библиотек (FastAPI, Uvicorn, SQLite, OpenPyXL)..." -ForegroundColor Yellow
$pkgCheck = & $foundPython -c "import fastapi, uvicorn, aiosqlite, openpyxl, multipart" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "      Установка недостающих зависимостей через pip..." -ForegroundColor Cyan
    & $foundPython -m pip install -r "Личный кабинет\requirements.txt"
    if ($LASTEXITCODE -ne 0) {
        & $foundPython -m pip install fastapi uvicorn aiosqlite openpyxl python-multipart google-analytics-data
    }
}
Write-Host "[OK] Все необходимые библиотеки установлены." -ForegroundColor Green

# 3. Правило брандмауэра Windows для входящих подключений (порты 8010 и 8001)
try {
    netsh advfirewall firewall add rule name="Alasster Cabinet Port 8010" dir=in action=allow protocol=TCP localport=8010 | Out-Null
    netsh advfirewall firewall add rule name="Alasster Student Port 8001" dir=in action=allow protocol=TCP localport=8001 | Out-Null
} catch {}

# 4. Определение интернет и локальных адресов
$publicUrl = "https://6a.tailc56f23.ts.net"
try {
    $runtimeFile = Join-Path $scriptDir "Личный кабинет\.runtime\public_url.txt"
    if (Test-Path $runtimeFile) {
        $pUrl = (Get-Content $runtimeFile).Trim()
        if ($pUrl) { $publicUrl = $pUrl }
    }
} catch {}

$lanIp = "127.0.0.1"
try {
    $ips = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) | 
        Where-Object { 
            $_.AddressFamily -eq 'InterNetwork' -and 
            -not $_.IPAddressToString.StartsWith('127.') -and 
            -not $_.IPAddressToString.StartsWith('169.254.') -and
            -not $_.IPAddressToString.StartsWith('100.')
        } | Select-Object -ExpandProperty IPAddressToString
    if ($ips) {
        if ($ips -is [array]) { $lanIp = $ips[0] } else { $lanIp = $ips }
    }
} catch {}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  СЕРВЕР УСПЕШНО ЗАПУСКАЕТСЯ! ДОСТУПЕН В ЛЮБОЙ СЕТИ И НА ВСЕХ УСТРОЙСТВАХ" -ForegroundColor Green
Write-Host ""
Write-Host "  Вход для учителя:" -ForegroundColor White
Write-Host "    -> С этого компьютера:       http://127.0.0.1:8010" -ForegroundColor Cyan
Write-Host "    -> По школьному Wi-Fi / LAN: http://$lanIp`:8010" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ДЛЯ УЧЕНИКОВ (сдача тестов с любых телефонов / мобильного интернета):" -ForegroundColor Yellow
Write-Host "    -> ИНТЕРНЕТ (Tailscale):     $publicUrl/generator/exam/<id_работы>" -ForegroundColor Magenta
Write-Host "    -> В локальном Wi-Fi:        http://$lanIp`:8010/generator/exam/<id_работы>" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Сервисы единого сервера:" -ForegroundColor Gray
Write-Host "    [+] Личный кабинет учителя (порт 8010)" -ForegroundColor Gray
Write-Host "    [+] Генератор тестов, СОР и СОЧ" -ForegroundColor Gray
Write-Host "    [+] Интернет-шлюз для учеников (порт 8001 / Tailscale Funnel)" -ForegroundColor Gray
Write-Host "    [+] Онлайн мониторинг и проведение" -ForegroundColor Gray
Write-Host "    [+] Раздел «Мои материалы»" -ForegroundColor Gray
Write-Host ""
Write-Host "  Для остановки сервера нажмите Ctrl + C в этом окне." -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location (Join-Path $scriptDir "Личный кабинет")
& $foundPython server.py
