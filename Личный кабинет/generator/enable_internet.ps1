$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new()
Set-Location -LiteralPath $PSScriptRoot

function Test-BagalauHealth([string]$BaseUrl) {
    try {
        $health = Invoke-RestMethod -Uri ($BaseUrl + '/api/health') -TimeoutSec 4
        return ($health.ok -eq $true)
    } catch { return $false }
}

function Get-LocalStudentUrls {
    $urls = @()
    [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() |
        Where-Object { $_.OperationalStatus -eq 'Up' -and $_.NetworkInterfaceType -ne 'Loopback' } |
        ForEach-Object {
            $_.GetIPProperties().UnicastAddresses |
                Where-Object { $_.Address.AddressFamily -eq 'InterNetwork' -and $_.Address.ToString() -notlike '169.254.*' -and $_.Address.ToString() -notlike '127.*' } |
                ForEach-Object { $urls += ('http://' + $_.Address + ':8001/generator/exam/') }
        }
    return $urls | Select-Object -Unique
}

try {
    $runtime = Join-Path $PSScriptRoot '.runtime'
    New-Item -ItemType Directory -Path $runtime -Force | Out-Null
    $tailscale = Get-Command tailscale.exe -ErrorAction SilentlyContinue
    $exe = if ($tailscale) { $tailscale.Source } else { 'C:\Program Files\Tailscale\tailscale.exe' }
    $state = $null
    if (Test-Path -LiteralPath $exe) {
        try {
            $stateJson = & $exe status --json 2>$null
            if ($LASTEXITCODE -eq 0) {
                $candidateState = $stateJson | ConvertFrom-Json
                if ($candidateState.BackendState -eq 'Running' -and $candidateState.Self.Online) { $state = $candidateState }
            }
        } catch { $state = $null }
    }

    # Reuse the running server; never interrupt a lesson or launch a second copy.
    $localReady = Test-BagalauHealth 'http://127.0.0.1:8010'
    $studentReady = Test-BagalauHealth 'http://127.0.0.1:8001'
    if ($localReady -and -not $studentReady) {
        throw 'Сервер работает без ученического интернет-входа на порту 8001. После окончания текущей работы перезапустите start_server.bat и повторите запуск.'
    }
    if (-not $localReady) {
        if ($studentReady) { throw 'Порт 8001 занят, но основной сервер недоступен. Проверьте уже запущенный сервер.' }
        Write-Host 'Запускается сервер. Повторный запуск при работающем сервере не требуется.'
        $arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + (Join-Path $PSScriptRoot 'start_server.ps1') + '" -NoFirewall'
        $process = Start-Process powershell.exe -ArgumentList $arguments -WindowStyle Hidden -PassThru `
            -RedirectStandardOutput (Join-Path $runtime 'phone-server.log') `
            -RedirectStandardError (Join-Path $runtime 'phone-server-error.log')
        $deadline = (Get-Date).AddSeconds(60)
        do {
            $localReady = Test-BagalauHealth 'http://127.0.0.1:8010'
            $studentReady = Test-BagalauHealth 'http://127.0.0.1:8001'
            if ($localReady -and $studentReady) { break }
            if ($process.HasExited) { throw 'Сервер не запущен. Подробности: .runtime/phone-server-error.log и .runtime/phone-server.log.' }
            Start-Sleep -Milliseconds 500
        } while ((Get-Date) -lt $deadline)
        if (-not ($localReady -and $studentReady)) { throw 'Сервер ещё не готов. Проверьте .runtime/phone-server-error.log и повторите запуск.' }
    }

    $publicReady = $false
    $publicUrl = $null

    if ($state) {
        $url = 'https://' + $state.Self.DNSName.TrimEnd('.')
        Write-Host 'Публикуется ученический вход через Tailscale Funnel.'
        $ErrorActionPreference = 'Continue'
        & $exe funnel --bg --https=443 http://127.0.0.1:8001
        $result = $LASTEXITCODE
        $ErrorActionPreference = 'Stop'
        if ($result -eq 0) {
            for ($attempt = 0; $attempt -lt 8; $attempt++) {
                if (Test-BagalauHealth $url) { $publicReady = $true; $publicUrl = $url; break }
                Start-Sleep -Seconds 1
            }
        }
    }

    if (-not $publicReady) {
        $cloudflared = Get-Command cloudflared.exe -ErrorAction SilentlyContinue
        if ($cloudflared) {
            $cfLog = Join-Path $runtime 'cloudflared.log'
            $cfErr = Join-Path $runtime 'cloudflared-error.log'
            Remove-Item -LiteralPath $cfLog, $cfErr -Force -ErrorAction SilentlyContinue
            Start-Process $cloudflared.Source -ArgumentList 'tunnel --no-autoupdate --url http://127.0.0.1:8001' -WindowStyle Hidden `
                -RedirectStandardOutput $cfLog -RedirectStandardError $cfErr | Out-Null
            for ($attempt = 0; $attempt -lt 15; $attempt++) {
                if (Test-Path -LiteralPath $cfLog) {
                    $match = Select-String -LiteralPath $cfLog -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -AllMatches | Select-Object -Last 1
                    if ($match) { $publicUrl = $match.Matches[0].Value; $publicReady = $true; break }
                }
                if (Test-Path -LiteralPath $cfErr) {
                    $match = Select-String -LiteralPath $cfErr -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -AllMatches | Select-Object -Last 1
                    if ($match) { $publicUrl = $match.Matches[0].Value; $publicReady = $true; break }
                }
                Start-Sleep -Seconds 1
            }
        }
    }

    if ($publicReady) {
        [IO.File]::WriteAllText((Join-Path $runtime 'public_url.txt'), $publicUrl, [Text.UTF8Encoding]::new($false))
        Write-Host ('Проверено: сервер доступен через интернет. Внешний адрес: ' + $publicUrl)
    } else {
        Remove-Item -LiteralPath (Join-Path $runtime 'public_url.txt') -Force -ErrorAction SilentlyContinue
        Write-Host 'Внешний туннель недоступен. Показываю адреса локальной сети; они работают только в той же сети.' -ForegroundColor Yellow
        Get-LocalStudentUrls | ForEach-Object { Write-Host ('  ' + $_) }
    }
    Write-Host 'Кабинет: http://127.0.0.1:8010'
    Write-Host 'В кабинете учителя заново откройте мониторинг работы и скопируйте ссылку ученикам.'
    if ($publicReady) { Write-Host 'Ученикам Tailscale не нужен: ссылка работает через интернет.' }
    else { Write-Host 'Для доступа из другой сети установите Tailscale или cloudflared на ПК учителя.' }
    Write-Host 'Урок пересоздавать не нужно: отправьте ученику прямую HTTPS-ссылку на ту же работу.'
    Write-Host 'Это окно можно закрыть: сервер продолжит принимать ответы.'
    Write-Host 'Сервер и Tailscale на ПК учителя должны оставаться включёнными.'
    exit 0
} catch {
    Write-Host ('ОШИБКА: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
