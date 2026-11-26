@echo off
cls
echo ======================================================
echo    CAI DAT TRO LY MINHDUONG84VN AI (WORD VA EXCEL)
echo ======================================================
echo.

set "TARGET_DIR=%LOCALAPPDATA%\MinhDuong84vn"
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [1/3] Dang sao chep file cau hinh Manifest...
if exist "%~dp0manifest.prod.xml" copy /y "%~dp0manifest.prod.xml" "%TARGET_DIR%\manifest.xml" >nul
if exist "%~dp0manifest.xml" copy /y "%~dp0manifest.xml" "%TARGET_DIR%\manifest.xml" >nul

echo [2/3] Dang dang ky Add-in vao Microsoft Office...
reg add "HKCU\Software\Microsoft\Office\16.0\WEF\Developer" /v "c7b91d3e-4f2a-4a8b-9e11-7a2e6f3d9b40" /t REG_SZ /d "%TARGET_DIR%\manifest.xml" /f >nul

echo [3/3] Dang lam sach bo nho dem Office...
if exist "%LOCALAPPDATA%\Microsoft\Office\16.0\Wef" rd /s /q "%LOCALAPPDATA%\Microsoft\Office\16.0\Wef" >nul 2>&1

echo.
echo ======================================================
echo         CAI DAT HOAN TAT THANH CONG!
echo ======================================================
echo.
echo Ban chi can:
echo   1. Mo Microsoft Word hoac Excel len.
echo   2. Tren thanh Menu Trang chu (Home) se xuat hien nut:
echo      MinhDuong84vn AI
echo   3. Bam vao nut de bat dau su dung.
echo.
pause