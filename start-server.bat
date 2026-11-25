@echo off
title Gemini Office Add-in Dev Server
echo ========================================================
echo   Dang khoi dong Gemini Office Add-in Server...
echo ========================================================
cd /d "%~dp0"
node dev-server.mjs
pause
