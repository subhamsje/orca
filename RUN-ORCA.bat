@echo off
title ORCA 4.0 Marine Operating System
echo ==================================================
echo     STARTING ORCA 4.0 MARINE OPERATING SYSTEM     
echo ==================================================

echo Starting Backend FastAPI Server...
start cmd /k "cd backend && venv\Scripts\activate && python main.py"

echo Starting Frontend React PWA...
start cmd /k "cd frontend && npm run dev"

echo.
echo ORCA 4.0 is running on http://localhost:5173
pause
