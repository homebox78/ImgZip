@echo off
chcp 65001 >nul
title ImageZip (ImgZip)
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=
echo ImageZip을 실행합니다...
call "node_modules\.bin\electron.cmd" .
