# scripts/enable-githooks.ps1
# One-time setup: point git at the .githooks/ folder so pre-commit and pre-push run automatically.
# Run from repo root:   .\scripts\enable-githooks.ps1

Push-Location (Split-Path $PSScriptRoot -Parent)

git config core.hooksPath .githooks

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: git hooks enabled. .githooks/pre-commit and .githooks/pre-push will now run automatically." -ForegroundColor Green
    Write-Host ""
    Write-Host "Verify with:  git config --get core.hooksPath"
    Write-Host "Disable with: git config --unset core.hooksPath"
} else {
    Write-Host "FAILED to set core.hooksPath" -ForegroundColor Red
    exit 1
}

Pop-Location
