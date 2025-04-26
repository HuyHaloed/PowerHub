# # AI_services/main.py
# from fastapi import FastAPI
# from fastapi import WebSocket
# from ai_manager import AiManager
# from voice_interpreter import VoiceInterpreter
# from mqttservice import turn_on_light, turn_off_light, turn_on_fan, turn_off_fan, get_temperature  # Import get_temperature
# import datetime
# import logging

# app = FastAPI()
# ai = AiManager()
# vi = VoiceInterpreter()

# # --- Setup Logging (Basic) ---
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# logger = logging.getLogger(__name__)


# async def fetch_and_predict():
#     """Fetches temperature from Adafruit IO and makes a prediction."""
#     try:
#         temperature = get_temperature()
#         if temperature is not None:
#             data = {"temperature": float(temperature)}
#             prediction_data = ai.prepare_data_for_prediction(data)  # Assuming AiManager has this method
#             if prediction_data is not None:
#                 temp_pred, humid_pred = ai.make_prediction(prediction_data)
#                 log_message = f"Temperature from Adafruit IO: {temperature}, Prediction: Temp={temp_pred}, Humid={humid_pred}"
#                 logger.info(log_message)
#                 return {"predicted_temperature": temp_pred, "predicted_humidity": humid_pred}
#             else:
#                 logger.error("Failed to prepare data for prediction")
#                 return {"error": "Failed to prepare data"}
#         else:
#             logger.error("Failed to fetch temperature from Adafruit IO")
#             return {"error": "Failed to fetch temperature"}
#     except Exception as e:
#         logger.exception(f"Error in fetch_and_predict: {e}")
#         return {"error": "Internal server error"}


# @app.get("/predict")
# async def predict():
#     """Endpoint to get temperature and humidity predictions."""
#     return await fetch_and_predict()  # Use the fetch_and_predict function


# @app.post("/voice")
# async def voice(cmd: dict):
#     """Endpoint to interpret voice commands."""
#     return vi.interpret(cmd)


# @app.websocket("/ws/voice")
# async def websocket_voice(websocket: WebSocket):
#     """WebSocket endpoint for voice command interaction."""

#     await websocket.accept()
#     try:
#         while True:
#             data = await websocket.receive_text()
#             status, payload = vi.interpret(data)
#             await websocket.send_json({"status": status, "payload": payload})

#             if status == "OK" and payload:
#                 execute_payload(payload)

#     except Exception as e:
#         logger.error(f"WebSocket error: {e}")
#         await websocket.close()


# def execute_payload(payload: dict):
#     """Executes actions based on interpreted voice command payload."""

#     if payload.get("sharevalueLight") == True:
#         turn_on_light()
#     elif payload.get("sharevalueLight") == False:
#         turn_off_light()
#     elif payload.get("sharevalueFan") == True:
#         turn_on_fan()
#     elif payload.get("sharevalueFan") == False:
#         turn_off_fan()


# @app.post("/telemetry")
# async def telemetry(data: dict):
#     """Endpoint to receive telemetry data."""

#     # Consider using a database or queue instead of a global list
#     # sensor_history.append((datetime.datetime.now(), data['temperature'], data['humidity']))
#     logger.info(f"Received telemetry data: {data}")  # Log the received data
#     return {"status": "received"}

from fastapi import FastAPI, WebSocket, Request
from config import USE_AI_PREDICTION, USE_VOICE_INTERPRETER

if USE_AI_PREDICTION:
    from ai_manager import AiManager
    
if USE_VOICE_INTERPRETER:
    from voice_interpreter import VoiceInterpreter

from mqttservice import turn_on_light, turn_off_light, turn_on_fan, turn_off_fan

app = FastAPI()

if USE_AI_PREDICTION:
    ai = AiManager()

if USE_VOICE_INTERPRETER:
    vi = VoiceInterpreter()


def execute_payload(payload: dict):
    if payload.get("sharevalueLight") == True:
        turn_on_light()
    elif payload.get("sharevalueLight") == False:
        turn_off_light()
    elif payload.get("sharevalueFan") == True:
        turn_on_fan()
    elif payload.get("sharevalueFan") == False:
        turn_off_fan()

if USE_AI_PREDICTION:
    @app.get("/predict")
    async def predict():
        temp, humid = ai.make_prediction()
        return {"predicted_temperature": temp, "predicted_humidity": humid}

if USE_VOICE_INTERPRETER:
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

                # Nếu lệnh hợp lệ thì điều khiển MQTT
                if status == "OK" and payload:
                    execute_payload(payload)

        except Exception:
            await websocket.close()

@app.post("/telemetry")
async def telemetry(data: dict):
    # sensor_history.append((datetime.datetime.now(), data['temperature'], data['humidity']))
    return {"status": "received"}
