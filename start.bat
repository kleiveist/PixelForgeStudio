@echo off
cd /d "%~dp0"
echo Oeffne nach dem Start: http://127.0.0.1:4173
node scripts\dev-server.mjs
pause
