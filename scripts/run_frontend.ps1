# AgentTrust Frontend Launcher (PowerShell)
Write-Host "Starting AgentTrust Frontend Server on http://localhost:5173..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\..\frontend"
& cmd.exe /c "npm run dev"
