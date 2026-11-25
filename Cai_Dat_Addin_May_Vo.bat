@echo off
chcp 65001 >nul
title Cài đặt Trợ lý MinhDuong84vn Office AI

echo ======================================================
echo    CÀI ĐẶT TRỢ LÝ MINHDUONG84VN AI CHO WORD & EXCEL
echo ======================================================
echo.

set TARGET_DIR=%LOCALAPPDATA%\MinhDuong84vn
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [1/3] Đang sao chép tệp cấu hình Manifest...
if exist "%~dp0manifest.prod.xml" (
    copy /y "%~dp0manifest.prod.xml" "%TARGET_DIR%\manifest.xml" >nul
) else if exist "%~dp0manifest.xml" (
    copy /y "%~dp0manifest.xml" "%TARGET_DIR%\manifest.xml" >nul
) else (
    echo [LỖI] Không tìm thấy tệp manifest.prod.xml hoặc manifest.xml!
    pause
    exit /b
)

echo [2/3] Đang đăng ký Add-in vào Microsoft Office...
reg add "HKCU\Software\Microsoft\Office\16.0\WEF\Developer" /v "c7b91d3e-4f2a-4a8b-9e11-7a2e6f3d9b40" /t REG_SZ /d "%TARGET_DIR%\manifest.xml" /f >nul 2>&1

echo [3/3] Đang làm sạch bộ nhớ đệm Office để tải mới...
if exist "%LOCALAPPDATA%\Microsoft\Office\16.0\Wef" (
    rd /s /q "%LOCALAPPDATA%\Microsoft\Office\16.0\Wef" >nul 2>&1
)

echo.
echo ======================================================
echo   🎉 CHÚC MỪNG: CÀI ĐẶT THÀNH CÔNG RỰC RỠ!
echo ======================================================
echo.
echo Bây giờ bạn chỉ cần:
echo  1. Mở Microsoft Word hoặc Microsoft Excel lên.
echo  2. Nhìn trên thanh công cụ Home (Trang chủ) sẽ có biểu tượng:
echo     ✦ MinhDuong84vn AI
echo  3. Bấm vào nút đó là trợ lý sẵn sàng hỗ trợ công việc!
echo.
pause
