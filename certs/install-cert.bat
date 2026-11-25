@echo off
title Cai dat Chung chi SSL cho Localhost
echo ========================================================
echo   Dang cai dat chung chi SSL localhost vao Windows...
echo   (Neu Windows hien hop thoai canh bao bao mat, hay bam YES)
echo ========================================================
cd /d "%~dp0"
certutil -user -addstore Root "localhost.crt"
echo.
echo ========================================================
echo   DA CAI DAT THANH CONG!
echo   Bay gio hay quay lai Word / Excel va bam nut "Restart".
echo ========================================================
pause
