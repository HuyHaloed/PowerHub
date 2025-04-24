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

# <<< Added MQTT Import >>>
import paho.mqtt.client as mqtt

# Patch SpeechRecognition to support Vosk
def recognize_vosk(self, audio_data):
    # Ensure vosk_model exists before using it
    if hasattr(self, 'vosk_model') and self.vosk_model:
        rec = vosk.KaldiRecognizer(self.vosk_model, audio_data.sample_rate)
        rec.AcceptWaveform(audio_data.get_raw_data())
        return rec.Result()
    else:
        logger.error("Vosk model not available on Recognizer instance for recognize_vosk patch.")
        # Return an empty JSON structure to avoid errors downstream
        return "{}"


sr.Recognizer.recognize_vosk = recognize_vosk

# Import the refactored voice and prediction modules
import voice_interpreter
import prediction

logger = logging.getLogger(__name__)
INACTIVITY_TIMEOUT_SECONDS = 30

# <<< Added Global Counter for MQTT Request ID >>>
request_id_counter = 0

class AiManager:
    """Manages AI functionalities: Voice Control and Prediction."""

    def __init__(self, config_path="config/ai_config.json"):
        # Correct path assumption if config is one level up from ai_module
        if not os.path.exists(config_path) and config_path == "config/ai_config.json":
             # Try assuming script is run from project root, config is in project root/config
             alt_config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), config_path)
             if os.path.exists(alt_config_path):
                 config_path = alt_config_path
             else:
                 # Try assuming script is run from ai_module, config is in project root/config
                 alt_config_path_2 = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", config_path)
                 if os.path.exists(alt_config_path_2):
                     config_path = os.path.normpath(alt_config_path_2)

        logger.info(f"Loading AiManager config from: {config_path}")
        self.config = self._load_config(config_path)
        self.voice_enabled = self.config.get("voice_control", {}).get("enabled", False)
        self.prediction_enabled = self.config.get("prediction", {}).get("enabled", False)

        self.vosk_model: Optional[vosk.Model] = None
        self.speech_recognizer: Optional[sr.Recognizer] = None

        if self.voice_enabled:
            self._setup_voice_control()

        # Load voice interpreter config if available
        vi_config_relative_path = self.config.get("voice_control", {}).get("config_file") # e.g., "config/voice_config.json"
        if vi_config_relative_path:
            # Assume vi_config_relative_path is relative to the main config file's directory
            base_config_dir = os.path.dirname(os.path.abspath(config_path))
            full_vi_path = os.path.join(base_config_dir, vi_config_relative_path)
            if not os.path.exists(full_vi_path):
                 # Fallback: maybe it's relative to the script's location?
                 script_dir = os.path.dirname(os.path.abspath(__file__))
                 alt_vi_path = os.path.join(script_dir,"..", vi_config_relative_path) # If script in ai_module, config in root/config
                 if os.path.exists(alt_vi_path):
                      full_vi_path = os.path.normpath(alt_vi_path)
                 else:
                      # Fallback 2: Relative to current working directory?
                      full_vi_path = vi_config_relative_path


            logger.info(f"Attempting to load voice interpreter config from: {full_vi_path}")
            if not voice_interpreter.load_command_config(full_vi_path):
                logger.error("Failed to load voice interpreter config. Voice commands may not be recognized.")
        else:
             logger.warning("Voice interpreter config file path not found in ai_config.json")


    def _load_config(self, path: str) -> Dict[str, Any]:
        try:
            with open(path, "r") as f:
                return json.load(f)
        except FileNotFoundError:
             logger.error(f"AiManager config file not found at {path}")
             # Return a default structure to avoid downstream errors
             return {"voice_control": {"enabled": False}, "prediction": {"enabled": False}}
        except json.JSONDecodeError:
             logger.error(f"Error decoding JSON from {path}")
             return {"voice_control": {"enabled": False}, "prediction": {"enabled": False}}

    def _resolve_path(self, config_key: str, base_dir: str) -> Optional[str]:
        """Resolves a path from config, assuming it's relative to the base_dir."""
        relative_path = self.config.get(config_key, {}).get(config_key.split('.')[-1]) # Simplified access
        if relative_path and isinstance(relative_path, str):
            # Try resolving relative to the base config directory first
            abs_path = os.path.join(base_dir, relative_path)
            if os.path.exists(abs_path):
                return os.path.normpath(abs_path)
            else:
                 # Fallback: Check if it's relative to the script dir (if different)
                 script_dir = os.path.dirname(os.path.abspath(__file__))
                 alt_abs_path = os.path.join(script_dir,"..", relative_path) # If script in ai_module, models in root/models
                 if os.path.exists(alt_abs_path):
                      return os.path.normpath(alt_abs_path)
                 else:
                      # Fallback 3: Assume it's relative to CWD (less reliable)
                       cwd_path = os.path.abspath(relative_path)
                       if os.path.exists(cwd_path):
                           return cwd_path
                       else:
                           logger.warning(f"Path for '{config_key}' ('{relative_path}') not found relative to {base_dir} or script directory.")
                           return None # Path not found
        return None # Key or path not found in config or not a string

    def _setup_voice_control(self):
        vc_config = self.config.get("voice_control", {})
        # Determine base directory for resolving paths (usually directory of ai_config.json)
        # Need the path used in __init__ which might have been resolved
        # Let's assume self.config path is now absolute after __init__ logic
        base_config_dir = os.path.dirname(os.path.abspath(self.config.get("_source_path", "config/ai_config.json"))) # Need to store the path used

        try:
            vosk.SetLogLevel(vc_config.get("vosk_log_level", -1))

            # Resolve vosk model path
            model_relative_path = vc_config.get("vosk_model_path") # e.g., "models/vosk-model-en-us"
            if model_relative_path:
                # Try resolving relative to base config dir
                model_path = os.path.join(base_config_dir, model_relative_path)
                if not os.path.isdir(model_path):
                     # Fallback: relative to script dir's parent (project root?)
                     script_dir = os.path.dirname(os.path.abspath(__file__))
                     alt_model_path = os.path.join(script_dir, "..", model_relative_path)
                     if os.path.isdir(alt_model_path):
                          model_path = os.path.normpath(alt_model_path)
                     else:
                           # Fallback: Relative to CWD
                           if os.path.isdir(model_relative_path):
                                model_path = os.path.abspath(model_relative_path)
                           else:
                                model_path = None # Path not found
            else:
                 model_path = None

            if not model_path or not os.path.isdir(model_path):
                logger.error(f"Vosk model path invalid or not found: Resolved to '{model_path}' from config value '{model_relative_path}'")
                raise FileNotFoundError(f"Vosk model directory not found at resolved path: {model_path}")

            logger.info(f"Loading Vosk model from: {model_path}")
            self.vosk_model = vosk.Model(model_path)
            self.speech_recognizer = sr.Recognizer()
            # Pass model to recognizer instance for the patch to use
            self.speech_recognizer.vosk_model = self.vosk_model

            logger.info("Voice control components initialized (Vosk + SpeechRecognition).")

        except FileNotFoundError as e:
             logger.exception(f"Failed to find Vosk model: {e}")
             self.voice_enabled = False
        except Exception as e:
            logger.exception(f"Failed to setup voice control (Vosk): {e}")
            self.voice_enabled = False

    def interpret_text_command(self, text: str):
        # Ensure voice_interpreter module is loaded and config is loaded
        if 'voice_interpreter' in globals() and hasattr(voice_interpreter, 'interpret_command'):
            return voice_interpreter.interpret_command(text)
        else:
             logger.error("voice_interpreter module or interpret_command function not available.")
             return voice_interpreter.STATUS_UNRECOGNIZED, None

# ==============================================================================
if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    mqtt_client = None # Initialize MQTT client variable

    try:
        # --- MQTT Configuration ---
        MQTT_BROKER = "app.coreiot.io" # From main.cpp
        MQTT_PORT = 1883 # From main.cpp
        MQTT_TOKEN = "ZS9KjbmsPcXtniB8q9yP" # From main.cpp

        # --- MQTT Client Setup ---
        mqtt_client = mqtt.Client(client_id=f"ai_controller_{os.getpid()}", protocol=mqtt.MQTTv311)
        mqtt_client.username_pw_set(MQTT_TOKEN) # Use Token as username

        def on_connect(client, userdata, flags, rc):
             if rc == 0:
                 print("[MQTT] Connected successfully to ThingsBoard/CoreIOT!")
             else:
                 print(f"[MQTT] Connection failed: rc={rc} - {mqtt.connack_string(rc)}")

        def on_disconnect(client, userdata, rc): # Changed signature (3 args)
            print(f"[MQTT] Disconnected: rc={rc}")

        def on_publish(client, userdata, mid):
             print(f"[MQTT] Published message id: {mid}")

        mqtt_client.on_connect = on_connect
        mqtt_client.on_disconnect = on_disconnect
        mqtt_client.on_publish = on_publish # Optional: for debugging

        try:
            print(f"[MQTT] Connecting to {MQTT_BROKER}:{MQTT_PORT}...")
            mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
            mqtt_client.loop_start() # Start background network loop
            print("[MQTT] Network loop started.")
        except Exception as mqtt_e:
             print(f"[MQTT] Connection error: {mqtt_e}")
             mqtt_client = None # Indicate connection failure
        # --- End MQTT Setup ---


        # Initialize AI Manager (pass potential config path)
        ai_manager = AiManager(config_path="config/ai_config.json") # Adjust path if needed

        if ai_manager.voice_enabled:
            print("\n--- Voice Control Active (Listening with Vosk) ---")

            if not ai_manager.speech_recognizer:
                logger.error("Speech Recognizer not initialized.")
                raise SystemExit("Cannot proceed without Speech Recognizer.")

            # Vosk model check now happens within _setup_voice_control
            # if not ai_manager.vosk_model: # redundant check
            #     logger.error("Vosk model not initialized.")
            #     raise SystemExit("Cannot proceed without Vosk model.")

            mic_sample_rate = ai_manager.config.get("voice_control", {}).get("mic_sample_rate", 16000)
            try:
                microphone = sr.Microphone(sample_rate=mic_sample_rate)
                with microphone as source:
                    print("Adjusting for ambient noise, please wait...")
                    ai_manager.speech_recognizer.adjust_for_ambient_noise(source, duration=1)
                    print(f"Ready to listen! (Energy threshold: {ai_manager.speech_recognizer.energy_threshold:.2f})")


                last_activity_time = time.time()

                while True:
                    print("\nListening...")
                    with microphone as source:
                        try:
                            # Listen for audio
                            audio_data = ai_manager.speech_recognizer.listen(source, timeout=5, phrase_time_limit=10)
                            print("Processing audio with Vosk...")
                            last_activity_time = time.time() # Reset timer on activity

                            recognized_text = ""
                            try:
                                # Use the patched recognize_vosk method
                                raw_result = ai_manager.speech_recognizer.recognize_vosk(audio_data)
                                # print(f"DEBUG: Raw Vosk result: '{raw_result}'") # Debug if needed

                                if raw_result and raw_result.startswith('{'):
                                    try:
                                        # Vosk returns JSON string, parse it
                                        result_dict = json.loads(raw_result)
                                        # Get text, might be in 'text' or 'partial'
                                        recognized_text = result_dict.get("text", result_dict.get("partial", "")).strip().lower()

                                    except json.JSONDecodeError:
                                        print("Warning: Vosk returned non-JSON or malformed JSON.")
                                else:
                                     # Handle potential non-JSON output if necessary
                                     pass


                            except sr.UnknownValueError:
                                print("Vosk could not understand audio")
                            except sr.RequestError as e:
                                print(f"Could not request results from Vosk service?; {e}") # Less likely with local Vosk
                            except Exception as e:
                                print(f"Error during Vosk recognition processing: {e}")

                            print(f"Recognized: '{recognized_text}'")

                            if recognized_text:
                                status, payload = ai_manager.interpret_text_command(recognized_text)
                                print(f"  -> Status: {status}, Payload: {payload}")

                                # <<< --- MQTT RPC PUBLISHING --- >>>
                                if status == voice_interpreter.STATUS_OK and payload and mqtt_client and mqtt_client.is_connected():
                                     try:
                                         # Extract original method and params
                                         method_name = payload.get("method") # e.g., "setValue"
                                         params_dict = payload.get("params") # e.g., {"light": true}

                                         if method_name == "setValue" and params_dict and len(params_dict) == 1:
                                             device = list(params_dict.keys())[0] # "light" or "fan"
                                             value = list(params_dict.values())[0] # true or false

                                             # Map to the RPC method name expected by main.cpp
                                             rpc_method = ""
                                             if device == "light":
                                                 rpc_method = "setValueLight"
                                             elif device == "fan":
                                                 rpc_method = "setValueFan"

                                             if rpc_method:
                                                 # Create the RPC payload
                                                 rpc_payload = {
                                                     "method": rpc_method,
                                                     "params": value # Send the boolean value directly
                                                 }
                                                 message_json = json.dumps(rpc_payload)

                                                 # Generate unique request ID
                                                 request_id_counter += 1
                                                 rpc_topic = f"v1/devices/me/rpc/request/{request_id_counter}"

                                                 print(f"[MQTT] Publishing RPC to '{rpc_topic}': {message_json}")
                                                 # Publish with QoS 1 (optional, for better delivery guarantee)
                                                 mqtt_client.publish(rpc_topic, message_json, qos=1)
                                             else:
                                                 print(f"[MQTT] Unknown device '{device}' found in payload, cannot map to RPC.")
                                         else:
                                             print(f"[MQTT] Payload from interpreter not in expected format for RPC: {payload}")

                                     except Exception as pub_e:
                                         print(f"[MQTT] Error formatting or publishing RPC: {pub_e}")
                                elif status == voice_interpreter.STATUS_OK and payload and (not mqtt_client or not mqtt_client.is_connected()):
                                     print("[MQTT] Command recognized, but MQTT client not connected. Cannot send.")

                                # <<< --- END MQTT RPC PUBLISHING --- >>>


                                if status == voice_interpreter.STATUS_STOP:
                                    print("Stop command received. Exiting.")
                                    break
                            # else: # No recognized text or empty
                                 # Check inactivity if needed, even if no text recognized
                                 # current_time = time.time()
                                 # if (current_time - last_activity_time) > INACTIVITY_TIMEOUT_SECONDS:
                                 #    print(f"\nInactivity limit ({INACTIVITY_TIMEOUT_SECONDS}s) reached after silence. Exiting.")
                                 #    break

                        except sr.WaitTimeoutError:
                            # No speech detected in timeout period, check inactivity
                            current_time = time.time()
                            if (current_time - last_activity_time) > INACTIVITY_TIMEOUT_SECONDS:
                                print(f"\nInactivity limit ({INACTIVITY_TIMEOUT_SECONDS}s) reached. Exiting.")
                                break
                            else:
                                # Optional: print silence duration only occasionally to reduce noise
                                # if int(current_time - last_activity_time) % 10 == 0:
                                print(f"Silence duration: {current_time - last_activity_time:.1f}s / {INACTIVITY_TIMEOUT_SECONDS}s")
                                pass # Continue listening

                        except Exception as e:
                            logger.exception(f"An error occurred during audio processing loop: {e}")
                            time.sleep(1) # Avoid fast looping on unexpected errors


            except sr.RequestError as e:
                 # This might happen if trying to use online SR service without internet
                 logger.error(f"Could not request results from Speech Recognition service; {e}")
            except OSError as e:
                # Common if microphone is not found or permissions are wrong
                logger.error(f"Microphone error: {e}. Is a microphone connected and configured correctly?")
                print("\nERROR: Microphone not found or accessible. Please check connection and system permissions.")
            except Exception as e:
                logger.exception(f"Failed to initialize microphone or listening loop: {e}")

        else:
            print("\nVoice control is not enabled or failed to initialize (check config and Vosk model path).")

    except FileNotFoundError as e:
        logger.error(f"{e}. Please ensure config files (ai_config.json, voice_config.json) and Vosk model exist at expected paths.")
    except SystemExit as e:
        print(f"Exiting: {e}")
    except KeyboardInterrupt:
         print("\nCtrl+C received. Exiting.")
    except Exception as e:
        logger.exception(f"An unexpected error occurred at the main level: {e}")

    finally:
        # --- MQTT Cleanup ---
        if mqtt_client:
            print("[MQTT] Stopping loop and disconnecting...")
            mqtt_client.loop_stop()
            mqtt_client.disconnect()
            print("[MQTT] Disconnected.")
        # --- End MQTT Cleanup ---
        print("Application finished.")