@echo off
chcp 65001 >nul
title Gỡ cài đặt Trợ lý MinhDuong84vn Office AI

echo Đang gỡ bỏ đăng ký Add-in khỏi Microsoft Office...
reg delete "HKCU\Software\Microsoft\Office\16.0\WEF\Developer" /v "c7b91d3e-4f2a-4a8b-9e11-7a2e6f3d9b40" /f >nul 2>&1

if exist "%LOCALAPPDATA%\Microsoft\Office\16.0\Wef" (
    rd /s /q "%LOCALAPPDATA%\Microsoft\Office\16.0\Wef" >nul 2>&1
)

if exist "%LOCALAPPDATA%\MinhDuong84vn" (
    rd /s /q "%LOCALAPPDATA%\MinhDuong84vn" >nul 2>&1
)

echo Đã gỡ bỏ Add-in thành công!
pause
