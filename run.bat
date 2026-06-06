@echo off
chcp 65001 >nul
title 이미집 (ImgZip)
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=
echo 이미집을 실행합니다...
call "node_modules\.bin\electron.cmd" .
