import time
import logging
import speech_recognition as sr
import asyncio

from fastapi import FastAPI, WebSocket, Request
from config import USE_AI_PREDICTION, USE_VOICE_INTERPRETER
from ai_manager import AiManager
from mqttservice import turn_on_light, turn_off_light, turn_on_fan, turn_off_fan

logger = logging.getLogger(__name__)
INACTIVITY_TIMEOUT_SECONDS = 10

ai_manager = AiManager()

# === Hàm chạy Voice Control (background) ===
async def run_voice_control():
    logger.info("--- Voice Control Active (Online STT) ---")
    
    if not ai_manager.speech_recognizer:
        logger.error("Speech Recognizer component not initialized.")
        raise SystemExit("Voice init failed.")

    mic_sample_rate = ai_manager.config.get("voice_control", {}).get("mic_sample_rate", 16000)
    prediction_interval_seconds = ai_manager.config.get("prediction", {}).get("prediction_interval_seconds", 15)
    last_prediction_time = 0
    run_voice_loop = True

    try:
        microphone = sr.Microphone(sample_rate=mic_sample_rate)
        with microphone as source:
            logger.debug("Adjusting for ambient noise...")
            ai_manager.speech_recognizer.adjust_for_ambient_noise(source, duration=1)
            logger.info("Ready! Listening...")

        last_activity_time = time.time()

        while run_voice_loop:
            current_time = time.time()

            # Check prediction
            if ai_manager.prediction_enabled and (current_time - last_prediction_time) >= prediction_interval_seconds:
                logger.info("--- Making Prediction ---")
                ai_manager.make_prediction()
                last_prediction_time = current_time

            # Listen for command
            audio_data = None
            try:
                with microphone as source:
                    audio_data = ai_manager.speech_recognizer.listen(source, timeout=5, phrase_time_limit=10)
                logger.debug("Audio captured, processing...")
                last_activity_time = time.time()

            except sr.WaitTimeoutError:
                if (current_time - last_activity_time) > INACTIVITY_TIMEOUT_SECONDS:
                    logger.info("Inactivity timeout reached. Stopping voice loop.")
                    run_voice_loop = False
                else:
                    logger.debug("Silence...")
                    await asyncio.sleep(0.2)
                continue

            except sr.RequestError as e:
                logger.error(f"SR listen error: {e}")
                run_voice_loop = False
                continue

            except Exception as listen_err:
                logger.exception(f"Audio listening error: {listen_err}")
                await asyncio.sleep(1)
                continue

            # Process audio
            if audio_data:
                recognized_text = ""
                try:
                    recognized_text = ai_manager.speech_recognizer.recognize_google(audio_data, language='en-US').lower()
                    logger.info(f"Recognized: '{recognized_text}'")

                except sr.UnknownValueError:
                    logger.debug("Could not understand audio")
                    continue
                except sr.RequestError as e:
                    logger.warning(f"Could not request results from STT service; {e}")
                    await asyncio.sleep(2)
                    continue
                except Exception as recog_err:
                    logger.exception(f"Online STT error: {recog_err}")
                    continue

                # Interpret and act
                if recognized_text:
                    status, payload = ai_manager.interpret_text_command(recognized_text)
                    logger.info(f"  -> Interpreted: {status}, Payload: {payload}")

                    if status == "STOP":
                        logger.info("Stop command received. Exiting voice loop.")
                        run_voice_loop = False

        logger.info("Exited voice control loop.")

    except sr.RequestError as e:
        logger.error(f"SR setup/run error: {e}")
    except OSError as e:
        logger.error(f"Microphone OS error: {e}")
        print("\nERROR: Microphone not found or access denied.")
    except Exception as e:
        logger.exception(f"Voice loop error: {e}")

# === Hàm chạy Prediction Only (background) ===
async def run_prediction_only():
    logger.info("Voice disabled. Running prediction-only loop...")
    logger.info("Note: Prediction loop needs sensor data. Add data manually to 'sensor_history' or re-integrate a data source.")

    prediction_interval_seconds = ai_manager.config.get("prediction", {}).get("prediction_interval_seconds", 15)
    last_prediction_time = 0

    try:
        while True:
            current_time = time.time()
            if (current_time - last_prediction_time) >= prediction_interval_seconds:
                logger.info("--- Making Prediction ---")
                ai_manager.make_prediction()
                last_prediction_time = current_time
                logger.debug(f"(Prediction loop run. Next check in {prediction_interval_seconds}s.)")

            await asyncio.sleep(1)

    except asyncio.CancelledError:
        logger.info("Prediction loop cancelled.")
    except KeyboardInterrupt:
        logger.info("Ctrl+C detected. Exiting prediction loop.")

# === Hàm xử lý Payload ===
def execute_payload(payload: dict):
    if payload.get("sharevalueLight") == True:
        turn_on_light()
    elif payload.get("sharevalueLight") == False:
        turn_off_light()
    elif payload.get("sharevalueFan") == True:
        turn_on_fan()
    elif payload.get("sharevalueFan") == False:
        turn_off_fan()

async def create_app() -> FastAPI:
    #todo
    app = FastAPI()
    # === API ===
    if USE_AI_PREDICTION:
        @app.get("/predict")
        async def predict():
            temp, humid = ai_manager.make_prediction()
            return {"predicted_temperature": temp, "predicted_humidity": humid}

    if USE_VOICE_INTERPRETER:
        @app.post("/voice")
        async def voice(cmd: dict):
            if "text" not in cmd:
                return {"status": "error", "message": "Missing 'text' field"}
            text = cmd["text"]
            status, payload = ai_manager.interpret_text_command(text)
            if status == "OK" and payload:
                execute_payload(payload)
            return {"status": status, "payload": payload}

        @app.websocket("/ws/voice")
        async def websocket_voice(websocket: WebSocket):
            await websocket.accept()
            try:
                while True:
                    data = await websocket.receive_text()
                    status, payload = ai_manager.interpret_text_command(data)
                    await websocket.send_json({"status": status, "payload": payload})

                    if status == "OK" and payload:
                        execute_payload(payload)

            except Exception:
                await websocket.close()

    @app.post("/telemetry")
    async def telemetry(data: dict):
        return {"status": "received"}

    # === Startup Tasks ===
    @app.on_event("startup")
    async def startup_event():
        if USE_VOICE_INTERPRETER:
            asyncio.create_task(run_voice_control())
        elif USE_AI_PREDICTION:
            asyncio.create_task(run_prediction_only())
    return app