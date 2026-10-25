@echo off
echo Starting AgentTrust Frontend Dev Server...
cd "%~dp0\..\frontend"
call npm.cmd run dev
pause
