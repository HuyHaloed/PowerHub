# AI_services/main.py
from fastapi import FastAPI
from ai_manager import AiManager
from voice_interpreter import VoiceInterpreter
from mqttservice import turn_on_light, turn_off_light, turn_on_fan, turn_off_fan

def execute_payload(payload: dict):
    if payload.get("sharevalueLight") == True:
        turn_on_light()
    elif payload.get("sharevalueLight") == False:
        turn_off_light()
    elif payload.get("sharevalueFan") == True:
        turn_on_fan()
    elif payload.get("sharevalueFan") == False:
        turn_off_fan()

app = FastAPI()
ai = AiManager()
vi = VoiceInterpreter()

@app.get("/predict")
async def predict():
    temp, humid = ai.make_prediction()
    return {"predicted_temperature": temp, "predicted_humidity": humid}

@app.post("/voice")
async def voice(cmd: dict):
    return vi.interpret(cmd)

@app.websocket("/ws/voice")
async def websocket_voice(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            status, payload = vi.interpret(data)
            await websocket.send_json({"status": status, "payload": payload})

            # Nếu interpret thành công, thì tự động điều khiển MQTT
            if status == "OK" and payload:
                execute_payload(payload)

    except Exception as e:
        await websocket.close()
        
@app.post("/telemetry")
async def telemetry(data: dict):
    # data = {"temperature": 29.3, "humidity": 72.5}
    sensor_history.append((datetime.datetime.now(), data['temperature'], data['humidity']))
    return {"status": "received"}