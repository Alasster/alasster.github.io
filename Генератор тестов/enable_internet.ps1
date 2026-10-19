$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new()
Set-Location -LiteralPath $PSScriptRoot
try {
    $tailscale = Get-Command tailscale.exe -ErrorAction SilentlyContinue
    $exe = if ($tailscale) { $tailscale.Source } else { 'C:\Program Files\Tailscale\tailscale.exe' }
    if (-not (Test-Path -LiteralPath $exe)) { throw 'Установите Tailscale на ПК учителя и войдите в свою учётную запись.' }
    $state = & $exe status --json | ConvertFrom-Json
    if (-not $state.Self.Online) { throw 'Tailscale не подключён.' }
    $url = 'https://' + $state.Self.DNSName.TrimEnd('.')
    Write-Host 'Публикуется только ученический вход. Кабинет учителя остаётся в локальной сети.'
    $ErrorActionPreference = 'Continue'
    & $exe funnel --bg --https=443 http://127.0.0.1:8001
    $result = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($result -ne 0) { throw 'Внешний доступ не включён. Выполните инструкции Tailscale выше.' }
    $runtime = Join-Path $PSScriptRoot '.runtime'
    New-Item -ItemType Directory -Path $runtime -Force | Out-Null
    [IO.File]::WriteAllText((Join-Path $runtime 'public_url.txt'), $url, [Text.UTF8Encoding]::new($false))
    Write-Host ('Внешний адрес: ' + $url)
    Write-Host 'В кабинете учителя заново откройте мониторинг работы и скопируйте ссылку ученикам.'
    Write-Host 'Сервер и Tailscale на ПК учителя должны оставаться включёнными.'
    exit 0
} catch {
    Write-Host ('ОШИБКА: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
