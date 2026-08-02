@echo off
title SAKAR CRM Runner

echo ===================================================
echo Starting SAKAR CRM Application (Backend + Frontend)
echo ===================================================
echo.

:: Launch Backend API in a new terminal window
start "SAKAR CRM - Backend API" cmd /k "cd /d %~dp0backend && npm run dev"

:: Launch Frontend Web App in a new terminal window
start "SAKAR CRM - Frontend Web App" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Backend and Frontend servers are launching in separate windows!
echo.
echo - Backend API: http://localhost:4000
echo - Frontend Web App: http://localhost:3000
echo.
pause
