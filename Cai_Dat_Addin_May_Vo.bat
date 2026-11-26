@echo off
cls
echo ======================================================
echo    CAI DAT TRO LY MINHDUONG84VN AI (WORD VA EXCEL)
echo ======================================================
echo.

echo [1/4] Dang dong Microsoft Word va Excel (neu dang mo)...
taskkill /f /im winword.exe >nul 2>&1
taskkill /f /im excel.exe >nul 2>&1

set "TARGET_DIR=%LOCALAPPDATA%\MinhDuong84vn"
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [2/4] Dang sao chep file cau hinh Manifest Cloudflare...
if exist "%~dp0manifest.xml" copy /y "%~dp0manifest.xml" "%TARGET_DIR%\manifest.xml" >nul

echo [3/4] Dang dang ky Add-in vao Microsoft Office...
reg add "HKCU\Software\Microsoft\Office\16.0\WEF\Developer" /v "c7b91d3e-4f2a-4a8b-9e11-7a2e6f3d9b40" /t REG_SZ /d "%TARGET_DIR%\manifest.xml" /f >nul

echo [4/4] Dang lam sach bo nho dem Office de tai ban moi nhat...
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
