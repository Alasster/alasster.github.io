param([switch]$ConfigureFirewallOnly, [switch]$NoFirewall)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
Set-Location -LiteralPath $PSScriptRoot
$ruleName = 'Bagalau Server 8000'

function Enable-BagalauFirewall {
    $admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $admin) {
        Write-Host 'Для доступа учеников подтвердите запрос Windows на настройку порта 8000.'
        $arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $PSCommandPath + '" -ConfigureFirewallOnly'
        $process = Start-Process powershell.exe -ArgumentList $arguments -Verb RunAs -WindowStyle Hidden -Wait -PassThru
        if ($process.ExitCode -ne 0) { throw 'Не удалось применить сетевое правило.' }
        return
    }
    $rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if ($rule) {
        $rule | Set-NetFirewallRule -Enabled True -Direction Inbound -Action Allow -Profile Any
        $rule | Get-NetFirewallPortFilter | Set-NetFirewallPortFilter -Protocol TCP -LocalPort 8000
        $rule | Get-NetFirewallAddressFilter | Set-NetFirewallAddressFilter -RemoteAddress LocalSubnet
    } else {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Enabled True -Profile Any -Protocol TCP -LocalPort 8000 -RemoteAddress LocalSubnet | Out-Null
    }
    $effective = Get-NetFirewallRule -PolicyStore ActiveStore -DisplayName $ruleName
    if (-not ($effective | Where-Object { $_.Enabled -eq 'True' -and $_.Action -eq 'Allow' })) {
        throw 'Правило отсутствует в действующей политике Windows.'
    }
    Write-Host 'Доступ к TCP 8000 для локальной сети разрешён во всех профилях Windows.'
}

try {
    if ($ConfigureFirewallOnly) { Enable-BagalauFirewall; exit 0 }
    $python = $null
    foreach ($candidate in @('python3.13.exe', 'python.exe', 'python3.exe')) {
        $command = Get-Command $candidate -ErrorAction SilentlyContinue
        if ($command) {
            & $command.Source -c 'import sys; assert sys.version_info >= (3, 9)' 2>$null
            if ($LASTEXITCODE -eq 0) { $python = $command.Source; break }
        }
    }
    if (-not $python) { throw 'Не найден Python 3.9 или новее. Установите Python и повторите запуск.' }
    & $python -c 'import fastapi, uvicorn, aiosqlite, openpyxl, multipart' 2>$null
    if ($LASTEXITCODE -ne 0) {
        & $python -m pip install -r (Join-Path $PSScriptRoot 'requirements.txt')
        if ($LASTEXITCODE -ne 0) { throw 'Не установлены зависимости. Проверьте интернет и повторите запуск.' }
    }
    if (-not $NoFirewall) {
        try {
            $existing = Get-NetFirewallRule -PolicyStore ActiveStore -DisplayName $ruleName -ErrorAction SilentlyContinue |
                Where-Object { $_.Enabled -eq 'True' -and $_.Action -eq 'Allow' -and $_.Profile -eq 'Any' }
            $ports = $existing | Get-NetFirewallPortFilter | Where-Object { $_.LocalPort -eq '8000' -and $_.Protocol -eq 'TCP' }
            if (-not $ports) { Enable-BagalauFirewall }
        } catch { throw ('Сетевой доступ не настроен: ' + $_.Exception.Message) }
    }
    $probe = "import urllib.request,json; o=urllib.request.build_opener(urllib.request.ProxyHandler({})); assert json.load(o.open('http://127.0.0.1:8000/api/health',timeout=2)).get('ok') is True"
    & $python -c $probe 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host 'Сервер уже работает. Кабинет: http://127.0.0.1:8000/teacher'
        exit 0
    }
    Write-Host 'Кабинет учителя: http://127.0.0.1:8000/teacher'
    Write-Host 'Адреса для учеников (выберите Ethernet / Wi-Fi школьной сети):'
    [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() |
        Where-Object { $_.OperationalStatus -eq 'Up' -and $_.NetworkInterfaceType -ne 'Loopback' } |
        ForEach-Object {
            $adapter = $_
            $_.GetIPProperties().UnicastAddresses | Where-Object { $_.Address.AddressFamily -eq 'InterNetwork' -and $_.Address.ToString() -notlike '169.254.*' } |
                ForEach-Object { Write-Host ('  ' + $adapter.Name + ': http://' + $_.Address + ':8000') }
        }
    Write-Host 'Оставьте сервер запущенным до получения всех результатов. Остановка: Ctrl+C.'
    & $python (Join-Path $PSScriptRoot 'server.py')
    exit $LASTEXITCODE
} catch {
    Write-Host ('ОШИБКА: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
