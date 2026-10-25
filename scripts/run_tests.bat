@echo off
echo Running AgentTrust Test Suite...
cd "%~dp0\..\backend"
python -m pytest tests/ -v
echo.
echo Running Frontend Build Check...
cd "%~dp0\..\frontend"
call npm.cmd run build
pause
