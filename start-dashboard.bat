@echo off
title DEPL Sales Dashboard Server
cd /d "%~dp0"
echo ========================================================
echo Starting DEPL Sales Dashboard on http://localhost:3000 ...
echo ========================================================
npm.cmd run dev
pause
