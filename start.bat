@echo off
chcp 65001 >nul
title 이미집 (ImgZip)
echo 이미집 로컬 서버를 시작합니다...
echo 브라우저에서 http://localhost:8777 이 열립니다. (종료하려면 이 창을 닫으세요)
start "" http://localhost:8777
node "%~dp0server.js"
