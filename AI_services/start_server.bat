@echo off
echo Changing directory to AI_services...
cd /d D:\Bon Bon\project 1\git\PowerHub\AI_services

echo Activating virtual environment...
call .\venv\Scripts\activate

echo Starting FastAPI server...
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
