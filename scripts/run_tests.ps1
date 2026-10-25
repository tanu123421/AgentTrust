# AgentTrust Automated Tests Runner (PowerShell)
Write-Host "=== 1. Executing Backend Pytest Suite ===" -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\..\backend"
python -m pytest tests/ -v

Write-Host "`n=== 2. Executing Frontend TypeScript & Build Verification ===" -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\..\frontend"
& cmd.exe /c "npm run build"
