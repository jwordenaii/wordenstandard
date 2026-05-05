# scripts/preflight.ps1
# Run before every PR or push. Catches problems before CI does.
# Usage:  .\scripts\preflight.ps1

$ErrorActionPreference = 'Continue'
$failed = @()

function Step($name, $cmd) {
    Write-Host "`n=== $name ===" -ForegroundColor Cyan
    & cmd /c $cmd
    if ($LASTEXITCODE -ne 0) {
        $script:failed += $name
        Write-Host "FAILED: $name" -ForegroundColor Red
    } else {
        Write-Host "OK: $name" -ForegroundColor Green
    }
}

Push-Location (Split-Path $PSScriptRoot -Parent)

Step 'Lint'  'npm run lint'
Step 'Build' 'npm run build'

# Bundle size guard
Write-Host "`n=== Bundle Size Check ===" -ForegroundColor Cyan
if (Test-Path dist/assets) {
    $largest = Get-ChildItem dist/assets -File -Filter *.js | Sort-Object Length -Desc | Select-Object -First 1
    $sizeKB = [math]::Round($largest.Length / 1KB)
    Write-Host "Largest JS chunk: $($largest.Name) = $sizeKB KB"
    if ($sizeKB -gt 1200) {
        Write-Host "WARNING: chunk over 1200 KB — consider code-splitting" -ForegroundColor Yellow
    }
}

# Secret scan on staged changes
Write-Host "`n=== Secret Scan (staged changes) ===" -ForegroundColor Cyan
$staged = git diff --cached 2>$null
if ($staged) {
    $hits = $staged | Select-String -Pattern 'sk-[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|xoxb-|ghp_|"PRIVATE KEY"' -CaseSensitive:$false
    if ($hits) {
        Write-Host "POTENTIAL SECRET IN STAGED DIFF:" -ForegroundColor Red
        $hits | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        $failed += 'Secret scan'
    } else {
        Write-Host "OK: no obvious secrets in staged changes" -ForegroundColor Green
    }
} else {
    Write-Host "(nothing staged)" -ForegroundColor Gray
}

# Working tree status
Write-Host "`n=== Git status ===" -ForegroundColor Cyan
git status --short

Pop-Location

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
if ($failed.Count -eq 0) {
    Write-Host "All preflight checks passed. Safe to commit/push." -ForegroundColor Green
    exit 0
} else {
    Write-Host "FAILED: $($failed -join ', ')" -ForegroundColor Red
    exit 1
}
