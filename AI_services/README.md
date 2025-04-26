cách chạy folder AI_services 
cd AI_services
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
click 2 lần vào start_server.bat là chạy được fast_api trên localhost:8000
muốn chạy thử AI thì không cần start_server chỉ cần python ai_manager điều chỉnh chạy dự đoán hay giọng nói trong file config.py với USE_AI_PREDICTION = False (dự đoán nhiệt độ)
USE_VOICE_INTERPRETER = True (điều khiển giọng nói)