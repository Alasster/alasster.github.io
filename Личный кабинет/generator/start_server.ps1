param([switch]$ConfigureFirewallOnly, [switch]$NoFirewall)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$cabinetRoot = Split-Path -Parent $PSScriptRoot
$ruleName = 'Bagalau Student Gateway 8001'

function Enable-BagalauFirewall {
    $admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $admin) {
        Write-Host 'Для доступа учеников подтвердите запрос Windows на настройку порта 8001.'
        $arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $PSCommandPath + '" -ConfigureFirewallOnly'
        $process = Start-Process powershell.exe -ArgumentList $arguments -Verb RunAs -WindowStyle Hidden -Wait -PassThru
        if ($process.ExitCode -ne 0) { throw 'Не удалось применить сетевое правило.' }
        return
    }
    $rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if ($rule) {
        $rule | Set-NetFirewallRule -Enabled True -Direction Inbound -Action Allow -Profile Any
        $rule | Get-NetFirewallPortFilter | Set-NetFirewallPortFilter -Protocol TCP -LocalPort 8001
        $rule | Get-NetFirewallAddressFilter | Set-NetFirewallAddressFilter -RemoteAddress LocalSubnet
    } else {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Enabled True -Profile Any -Protocol TCP -LocalPort 8001 -RemoteAddress LocalSubnet | Out-Null
    }
    $effective = Get-NetFirewallRule -PolicyStore ActiveStore -DisplayName $ruleName
    if (-not ($effective | Where-Object { $_.Enabled -eq 'True' -and $_.Action -eq 'Allow' })) {
        throw 'Правило отсутствует в действующей политике Windows.'
    }
    Write-Host 'Доступ к TCP 8001 для учеников в локальной сети разрешён.'
}

try {
    if ($ConfigureFirewallOnly) { Enable-BagalauFirewall; exit 0 }
    $python = $null
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python313\python.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python312\python.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python311\python.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python310\python.exe')
    )
    foreach ($candidate in @('python.exe', 'python3.exe')) {
        $command = Get-Command $candidate -ErrorAction SilentlyContinue
        if ($command) { $candidates += $command.Source }
    }
    foreach ($candidate in $candidates) {
        if (-not (Test-Path -LiteralPath $candidate)) { continue }
        & $candidate -c 'import sys; sys.exit(sys.version_info < (3, 10))' 2>$null
        if ($LASTEXITCODE -eq 0) { $python = $candidate; break }
    }
    if (-not $python) { throw 'Не найден Python 3.10 или новее. Установите Python и повторите запуск.' }
    $requirements = Join-Path $cabinetRoot 'requirements.txt'
    & $python -c "import importlib.util,sys; sys.exit(not all(importlib.util.find_spec(m) for m in ['fastapi','uvicorn','aiosqlite','openpyxl','multipart']))" 2>$null
    if ($LASTEXITCODE -ne 0) {
        & $python -m pip install -r $requirements
        if ($LASTEXITCODE -ne 0) { throw 'Не установлены зависимости. Проверьте интернет и повторите запуск.' }
    }
    if (-not $NoFirewall) {
        try {
            $existing = Get-NetFirewallRule -PolicyStore ActiveStore -DisplayName $ruleName -ErrorAction SilentlyContinue |
                Where-Object { $_.Enabled -eq 'True' -and $_.Action -eq 'Allow' -and $_.Direction -eq 'Inbound' -and $_.Profile -eq 'Any' }
            $ports = $existing | Get-NetFirewallPortFilter | Where-Object { $_.LocalPort -eq '8001' -and $_.Protocol -eq 'TCP' }
            if (-not $ports) { Enable-BagalauFirewall }
        } catch { throw ('Сетевой доступ не настроен: ' + $_.Exception.Message) }
    }
    $env:PERSONAL_CABINET_HOST = '127.0.0.1'
    $env:PERSONAL_CABINET_PORT = '8010'
    $env:BAGALAU_STUDENT_PORT = '8001'
    $probe = @'
import urllib.request,json,sys
try:
    o=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    ready=json.load(o.open('http://127.0.0.1:8010/health',timeout=2)).get('ok') is True
except Exception:
    ready=False
sys.exit(0 if ready else 1)
'@
    & $python -c $probe 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host 'Сервер уже работает. Кабинет: http://127.0.0.1:8010'
        Write-Host 'Повторный запуск не нужен. Это окно можно закрыть.'
        exit 0
    }
    $env:PYTHONPATH = $cabinetRoot
    Write-Host 'Кабинет: http://127.0.0.1:8010'
    Write-Host 'Ученики открывают ссылки на работы через порт 8001.'
    Write-Host 'Оставьте сервер запущенным до получения всех результатов. Остановка: Ctrl+C.'
    & $python (Join-Path $cabinetRoot 'server.py')
    exit $LASTEXITCODE
} catch {
    Write-Host ('ОШИБКА: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
