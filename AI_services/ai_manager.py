# ai_module/ai_manager.py
import json
import os
import logging
import time
import pandas as pd
import xgboost as xgb
import vosk
import speech_recognition as sr
from typing import Dict, Tuple, Optional, Any, List

# Patch SpeechRecognition to support Vosk

def recognize_vosk(self, audio_data):
    rec = vosk.KaldiRecognizer(self.vosk_model, audio_data.sample_rate)
    rec.AcceptWaveform(audio_data.get_raw_data())
    return rec.Result()

sr.Recognizer.recognize_vosk = recognize_vosk

# Import the refactored voice and prediction modules
import voice_interpreter
import prediction

logger = logging.getLogger(__name__)
INACTIVITY_TIMEOUT_SECONDS = 30

class AiManager:
    """Manages AI functionalities: Voice Control and Prediction."""

    def __init__(self, config_path="config/ai_config.json"):
        self.config = self._load_config(config_path)
        self.voice_enabled = self.config.get("voice_control", {}).get("enabled", False)
        self.prediction_enabled = self.config.get("prediction", {}).get("enabled", False)

        self.vosk_model: Optional[vosk.Model] = None
        self.speech_recognizer: Optional[sr.Recognizer] = None

        if self.voice_enabled:
            self._setup_voice_control()

        # --- Load voice interpreter config if available ---
        vi_config_path = self.config.get("voice_control", {}).get("interpreter_config")
        if vi_config_path:
            full_vi_path = os.path.abspath(vi_config_path)
            if not voice_interpreter.load_command_config(full_vi_path):
                logger.error("Failed to load voice interpreter config. Voice commands may not be recognized.")

    def _load_config(self, path: str) -> Dict[str, Any]:
        with open(path, "r") as f:
            return json.load(f)

    def _resolve_path(self, dotted_key: str) -> Optional[str]:
        keys = dotted_key.split(".")
        value = self.config
        for key in keys:
            value = value.get(key, {})
        return os.path.abspath(value) if isinstance(value, str) else None

    def _setup_voice_control(self):
        vc_config = self.config.get("voice_control", {})
        try:
            vosk.SetLogLevel(vc_config.get("vosk_log_level", -1))
            model_path = self._resolve_path("voice_control.vosk_model_path")

            if not model_path or not os.path.isdir(model_path):
                logger.error(f"Vosk model path invalid or not found: {model_path}")
                raise FileNotFoundError(f"Vosk model directory not found at resolved path: {model_path}")

            logger.info(f"Loading Vosk model from: {model_path}")
            self.vosk_model = vosk.Model(model_path)
            self.speech_recognizer = sr.Recognizer()
            self.speech_recognizer.vosk_model = self.vosk_model

            logger.info("Voice control components initialized (Vosk + SpeechRecognition).")

        except Exception as e:
            logger.exception(f"Failed to setup voice control (Vosk): {e}")
            self.voice_enabled = False

    def interpret_text_command(self, text: str):
        return voice_interpreter.interpret_command(text)

# ==============================================================================
if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)

    try:
        ai_manager = AiManager()

        if ai_manager.voice_enabled:
            print("\n--- Voice Control Active (Listening with Vosk) ---")

            if not ai_manager.speech_recognizer:
                logger.error("Speech Recognizer not initialized.")
                raise SystemExit("Cannot proceed without Speech Recognizer.")

            if not ai_manager.vosk_model:
                logger.error("Vosk model not initialized.")
                raise SystemExit("Cannot proceed without Vosk model.")

            mic_sample_rate = ai_manager.config.get("voice_control", {}).get("mic_sample_rate", 16000)
            try:
                microphone = sr.Microphone(sample_rate=mic_sample_rate)
                with microphone as source:
                    print("Adjusting for ambient noise, please wait...")
                    ai_manager.speech_recognizer.adjust_for_ambient_noise(source, duration=1)
                    print("Ready to listen!")

                last_activity_time = time.time()

                while True:
                    print("\nListening...")
                    with microphone as source:
                        try:
                            audio_data = ai_manager.speech_recognizer.listen(source, timeout=5, phrase_time_limit=10)
                            print("Processing audio with Vosk...")
                            last_activity_time = time.time()

                            recognized_text = ""
                            try:
                                raw_text = ai_manager.speech_recognizer.recognize_vosk(audio_data)
                                print(f"DEBUG: Raw output from recognize_vosk: '{raw_text}'")

                                if raw_text.startswith('{'):
                                    try:
                                        recognized_text = json.loads(raw_text).get("text", "")
                                    except json.JSONDecodeError:
                                        print("Warning: recognize_vosk returned non-JSON or malformed JSON.")

                            except sr.UnknownValueError:
                                print("Vosk could not understand audio")
                            except sr.RequestError as e:
                                print(f"Could not request results from Vosk service?; {e}")
                            except Exception as e:
                                print(f"Error during Vosk recognition: {e}")

                            print(f"Recognized: '{recognized_text}'")

                            if recognized_text:
                                last_activity_time = time.time()
                                status, payload = ai_manager.interpret_text_command(recognized_text)
                                print(f"  -> Status: {status}, Payload: {payload}")
                                if status == voice_interpreter.STATUS_STOP:
                                    print("Stop command received. Exiting.")
                                    break
                            else:
                                current_time = time.time()
                                if (current_time - last_activity_time) > INACTIVITY_TIMEOUT_SECONDS:
                                    print(f"\nInactivity limit ({INACTIVITY_TIMEOUT_SECONDS}s) reached. Exiting.")
                                    break

                        except sr.WaitTimeoutError:
                            current_time = time.time()
                            if (current_time - last_activity_time) > INACTIVITY_TIMEOUT_SECONDS:
                                print(f"\nInactivity limit ({INACTIVITY_TIMEOUT_SECONDS}s) reached. Exiting.")
                                break
                            else:
                                print(f"Silence duration: {current_time - last_activity_time:.1f}s / {INACTIVITY_TIMEOUT_SECONDS}s")

                        except Exception as e:
                            logger.exception(f"An error occurred during audio processing loop: {e}")

            except OSError as e:
                logger.error(f"Microphone error: {e}. Is a microphone connected?")
                print("\nERROR: Microphone not found or accessible.")
            except Exception as e:
                logger.exception(f"Failed to initialize microphone or listening loop: {e}")

        else:
            print("\nVoice control is not enabled or failed to initialize.")

    except FileNotFoundError as e:
        logger.error(f"{e}. Please ensure config files exist.")
    except SystemExit as e:
        print(f"Exiting: {e}")
    except Exception as e:
        logger.exception(f"An unexpected error occurred: {e}")

