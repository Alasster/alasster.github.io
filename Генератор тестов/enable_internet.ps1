$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new()
Set-Location -LiteralPath $PSScriptRoot

function Test-BagalauHealth([string]$BaseUrl) {
    try {
        $health = Invoke-RestMethod -Uri ($BaseUrl + '/api/health') -TimeoutSec 4
        return ($health.ok -eq $true)
    } catch { return $false }
}

try {
    $tailscale = Get-Command tailscale.exe -ErrorAction SilentlyContinue
    $exe = if ($tailscale) { $tailscale.Source } else { 'C:\Program Files\Tailscale\tailscale.exe' }
    if (-not (Test-Path -LiteralPath $exe)) { throw 'Установите Tailscale на ПК учителя и войдите в свою учётную запись.' }
    $stateJson = & $exe status --json
    if ($LASTEXITCODE -ne 0) { throw 'Не удалось проверить Tailscale. Откройте приложение Tailscale и повторите запуск.' }
    $state = $stateJson | ConvertFrom-Json
    if ($state.BackendState -ne 'Running' -or -not $state.Self.Online) { throw 'Tailscale не подключён. Откройте Tailscale и войдите в свою учётную запись.' }
    $url = 'https://' + $state.Self.DNSName.TrimEnd('.')

    # Reuse the running server; never interrupt a lesson or launch a second copy.
    $localReady = Test-BagalauHealth 'http://127.0.0.1:8000'
    $studentReady = Test-BagalauHealth 'http://127.0.0.1:8001'
    if ($localReady -and -not $studentReady) {
        throw 'Сервер работает без ученического интернет-входа на порту 8001. После окончания текущей работы перезапустите start_server.bat и повторите запуск.'
    }
    $runtime = Join-Path $PSScriptRoot '.runtime'
    New-Item -ItemType Directory -Path $runtime -Force | Out-Null
    if (-not $localReady) {
        if ($studentReady) { throw 'Порт 8001 занят, но основной сервер недоступен. Проверьте уже запущенный сервер.' }
        Write-Host 'Запускается сервер. Повторный запуск при работающем сервере не требуется.'
        $arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + (Join-Path $PSScriptRoot 'start_server.ps1') + '" -NoFirewall'
        $process = Start-Process powershell.exe -ArgumentList $arguments -WindowStyle Hidden -PassThru `
            -RedirectStandardOutput (Join-Path $runtime 'phone-server.log') `
            -RedirectStandardError (Join-Path $runtime 'phone-server-error.log')
        $deadline = (Get-Date).AddSeconds(60)
        do {
            $localReady = Test-BagalauHealth 'http://127.0.0.1:8000'
            $studentReady = Test-BagalauHealth 'http://127.0.0.1:8001'
            if ($localReady -and $studentReady) { break }
            if ($process.HasExited) { throw 'Сервер не запущен. Подробности: .runtime/phone-server-error.log и .runtime/phone-server.log.' }
            Start-Sleep -Milliseconds 500
        } while ((Get-Date) -lt $deadline)
        if (-not ($localReady -and $studentReady)) { throw 'Сервер ещё не готов. Проверьте .runtime/phone-server-error.log и повторите запуск.' }
    }

    Write-Host 'Публикуется только ученический вход. Кабинет учителя остаётся в локальной сети.'
    Write-Host 'Если Tailscale покажет ссылку включения Funnel, откройте её и разрешите доступ в своей учётной записи.'
    $ErrorActionPreference = 'Continue'
    & $exe funnel --bg --https=443 http://127.0.0.1:8001
    $result = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($result -ne 0) { throw 'Внешний доступ не включён. Выполните инструкции Tailscale выше.' }
    $publicReady = $false
    for ($attempt = 0; $attempt -lt 6; $attempt++) {
        if (Test-BagalauHealth $url) { $publicReady = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $publicReady) { throw 'Внешняя ссылка пока не отвечает. Проверьте интернет на ПК учителя и повторите запуск. Локальный сервер продолжает работать.' }
    [IO.File]::WriteAllText((Join-Path $runtime 'public_url.txt'), $url, [Text.UTF8Encoding]::new($false))
    Write-Host ('Проверено: сервер доступен через интернет. Внешний адрес: ' + $url)
    Write-Host 'Кабинет учителя: http://127.0.0.1:8000/teacher'
    Write-Host 'В кабинете учителя заново откройте мониторинг работы и скопируйте ссылку ученикам.'
    Write-Host 'Телефон открывает её через мобильный интернет или любой Wi-Fi. IP телефона и установка Tailscale ученику не нужны.'
    Write-Host 'Урок пересоздавать не нужно: отправьте ученику прямую HTTPS-ссылку на ту же работу.'
    Write-Host 'Это окно можно закрыть: сервер продолжит принимать ответы.'
    Write-Host 'Сервер и Tailscale на ПК учителя должны оставаться включёнными.'
    exit 0
} catch {
    Write-Host ('ОШИБКА: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
