# ai_module/ai_manager.py
import argparse
import json
import os
import logging
import time
import pandas as pd
import xgboost as xgb
import speech_recognition as sr
from typing import Dict, Tuple, Optional, Any, List
# Import MQTT client and the CallbackAPIVersion enum
import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion # <-- Import the enum
import collections
import datetime
import numpy as np
import uuid

# Import local modules
# Ensure these files exist in the same directory or are accessible via PYTHONPATH
import voice_interpreter #
import prediction      #

# --- Argument Parsing ---
parser = argparse.ArgumentParser()
parser.add_argument("--debug", action="store_true", help="Enable debug logging")
args = parser.parse_args()

# --- Setup Logging ---
# Simplified format, level controlled by --debug flag
logging.basicConfig(
    level=logging.DEBUG if args.debug else logging.INFO,
    format='%(message)s' # Only output the message
)
logger = logging.getLogger(__name__)

# --- Constants ---
INACTIVITY_TIMEOUT_SECONDS = 10

# --- Globals ---
request_id_counter = 0
MAX_HISTORY_POINTS = 288
sensor_history = collections.deque(maxlen=MAX_HISTORY_POINTS)

# MQTT Configuration
SENSOR_TELEMETRY_TOPIC = "home/livingroom/temperture" # Topic to listen for sensor data
MQTT_BROKER = "app.coreiot.io" #
MQTT_PORT = 1883 #
MQTT_TOKEN = "ZS9KjbmsPcXtniB8q9yP" # Get token from environment variable
ATTRIBUTE_TOPIC = "v1/devices/me/attributes" # Topic for publishing attributes

if not MQTT_TOKEN:
    logger.warning("MQTT Token not found in environment variable 'MQTT_TOKEN'. MQTT connection will likely fail.")

class AiManager:
    """Manages AI functionalities: Voice Control (Online STT) and Prediction."""

    def __init__(self, config_path="config/ai_config.json"): #
        self.config_path = self._find_config_file(config_path)
        if not self.config_path:
             logger.error("AiManager config file not found. Using defaults.")
             self.config = {"voice_control": {"enabled": False}, "prediction": {"enabled": False}}
        else:
             logger.debug(f"Loading AiManager config from: {self.config_path}")
             self.config = self._load_config(self.config_path)
             self.config["_source_path"] = self.config_path
             logger.info("AI Manager configuration loaded.") # Important status

        self.voice_enabled = self.config.get("voice_control", {}).get("enabled", False) #
        self.prediction_enabled = self.config.get("prediction", {}).get("enabled", False) #

        self.speech_recognizer: Optional[sr.Recognizer] = None

        # Prediction attributes
        self.temp_model: Optional[xgb.Booster] = None
        self.humid_model: Optional[xgb.Booster] = None
        self.predictor_features: Optional[List[str]] = None
        self.prediction_params: Dict[str, Any] = {}

        # Setup components
        if self.voice_enabled:
            logger.info("Setting up voice control (Online STT)...") # Important status
            self.speech_recognizer = sr.Recognizer() # Initialize Recognizer
            self._load_voice_commands() # Load voice command definitions
        if self.prediction_enabled:
            self._setup_prediction() # Setup prediction models/features if enabled

    def _find_config_file(self, relative_path: str) -> Optional[str]: #
        # (Finds config file relative to script or project root)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        paths_to_check = [
            os.path.join(project_root, relative_path),
            os.path.join(script_dir, relative_path),
            relative_path
        ]
        for path in paths_to_check:
            abs_path = os.path.abspath(path)
            if os.path.exists(abs_path):
                return abs_path
        logger.warning(f"Config file check: Could not find '{relative_path}'")
        return None

    def _load_config(self, path: str) -> Dict[str, Any]: #
        # (Loads JSON configuration from path)
        try:
            with open(path, "r", encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.exception(f"Error loading config {path}: {e}")
            # Return default structure on error to prevent crashes
            return {"voice_control": {"enabled": False}, "prediction": {"enabled": False}}

    def _resolve_path_relative_to_config(self, relative_path: str) -> Optional[str]: #
        # (Finds other files relative to the main config file's location)
        if not relative_path or not isinstance(relative_path, str): return None
        # Try relative to the loaded config file first
        base_config_dir = os.path.dirname(self.config.get("_source_path", "."))
        abs_path = os.path.abspath(os.path.join(base_config_dir, relative_path))
        if os.path.exists(abs_path): return abs_path
        # Fallback to relative to script/project root/cwd
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        alt_path = os.path.abspath(os.path.join(project_root, relative_path))
        if os.path.exists(alt_path): return alt_path
        if os.path.exists(relative_path): return os.path.abspath(relative_path)
        logger.warning(f"Could not resolve path '{relative_path}'")
        return None

    def _load_voice_commands(self): #
        # (Loads command definitions from the JSON file specified in ai_config.json)
        logger.debug("Loading voice commands...")
        # Get path from main config
        vi_config_relative_path = self.config.get("voice_control", {}).get("config_file")
        # Find the actual file path
        full_vi_path = self._resolve_path_relative_to_config(vi_config_relative_path)
        if full_vi_path and os.path.exists(full_vi_path):
            logger.debug(f"Attempting load voice config from: {full_vi_path}")
            # Call the loading function in voice_interpreter.py
            if not voice_interpreter.load_command_config(full_vi_path):
                logger.error("Failed to load voice commands config.")
            else:
                 logger.info("Voice commands loaded.") # Important status
        else:
             logger.error(f"Voice commands config file not found: '{full_vi_path}' (from '{vi_config_relative_path}')")

    def _setup_prediction(self): #
        # (Loads prediction models and features if enabled)
        logger.debug("Setting up prediction...")
        pred_config = self.config.get("prediction", {}) #
        if not pred_config.get("enabled", False): #
             logger.info("Prediction disabled in config.") # Important status
             self.prediction_enabled = False; return

        # Get model/feature paths from config
        temp_model_rel = pred_config.get("temp_model_path")
        humid_model_rel = pred_config.get("humid_model_path")
        temp_model_path = self._resolve_path_relative_to_config(temp_model_rel)
        humid_model_path = self._resolve_path_relative_to_config(humid_model_rel)
        features_path = None
        if temp_model_path: # Try finding features relative to temp model
             base_model_dir = os.path.dirname(temp_model_path)
             features_path = os.path.join(base_model_dir, "predictor_features.json")
        if not features_path or not os.path.exists(features_path): # Fallback path
            features_path = self._resolve_path_relative_to_config("models/predictors/predictor_features.json")

        # Check if all required files exist
        paths_ok = True
        if not temp_model_path or not os.path.exists(temp_model_path):
             logger.error(f"Temp prediction model not found: {temp_model_path}"); paths_ok = False
        if not humid_model_path or not os.path.exists(humid_model_path):
             logger.error(f"Humid prediction model not found: {humid_model_path}"); paths_ok = False
        if not features_path or not os.path.exists(features_path):
             logger.error(f"Features file for prediction not found: {features_path}"); paths_ok = False
        if not paths_ok:
             logger.error("Disabling prediction due to missing model/feature files.")
             self.prediction_enabled = False; return

        # Load models and features
        try:
            logger.debug("Loading prediction models...")
            self.temp_model = xgb.Booster(); self.temp_model.load_model(temp_model_path) #
            self.humid_model = xgb.Booster(); self.humid_model.load_model(humid_model_path) #
            with open(features_path, 'r', encoding='utf-8') as f:
                self.predictor_features = json.load(f) #
            logger.info(f"Prediction models/features loaded ({len(self.predictor_features)} features).") # Important status

            # Store prediction parameters from config
            self.prediction_params = {
                "horizon": pred_config.get("prediction_horizon_minutes", 60),
                "sample": pred_config.get("minutes_per_sample", 60),
                "lags": pred_config.get("lag_steps_count", 5)
            }
            # Calculate minimum history needed based on params
            sample_interval = max(1, self.prediction_params['sample'])
            min_steps_needed = self.prediction_params['lags'] + (self.prediction_params['horizon'] // sample_interval)
            self.prediction_params["min_history"] = min_steps_needed
            logger.debug(f"Prediction params: {self.prediction_params}")
        except Exception as e:
            logger.exception(f"Failed prediction setup: {e}")
            self.prediction_enabled = False

    def interpret_text_command(self, text: str) -> Tuple[str, Optional[Dict]]: #
        # (Interprets recognized text using voice_interpreter module)
        if 'voice_interpreter' in globals() and hasattr(voice_interpreter, 'interpret_command'):
            # Get fuzzy threshold from config
            fuzzy_threshold = self.config.get("voice_control", {}).get("fuzzy_match_threshold", 80)
            # Call interpreter function
            return voice_interpreter.interpret_command(text, fuzzy_threshold=fuzzy_threshold)
        else:
             logger.error("voice_interpreter module not available.")
             return voice_interpreter.STATUS_UNRECOGNIZED, None #

    def make_prediction(self) -> Tuple[Optional[float], Optional[float]]: #
        # (Generates temperature/humidity prediction using loaded models)
        if not self.prediction_enabled or not self.temp_model or not self.humid_model or not self.predictor_features:
            return None, None
        global sensor_history
        min_hist = self.prediction_params.get("min_history", 6)
        if len(sensor_history) < min_hist:
            logger.debug(f"Skipping prediction: Insufficient history ({len(sensor_history)} < {min_hist} needed).")
            return None, None

        try:
            # Prepare history data
            history_list = list(sensor_history)
            history_df = pd.DataFrame(history_list, columns=['timestamp', 'temperature', 'humidity'])
            history_df['timestamp'] = pd.to_datetime(history_df['timestamp'])
            history_df = history_df.set_index('timestamp').sort_index()
            history_df = history_df[~history_df.index.duplicated(keep='last')] # Handle duplicate timestamps

            logger.debug(f"Preparing features using {len(history_df)} points for prediction...")
            # Generate features using prediction.py
            feature_vector_df = prediction.prepare_features(
                history_df=history_df, expected_features=self.predictor_features,
                prediction_horizon_minutes=self.prediction_params['horizon'],
                minutes_per_sample=self.prediction_params['sample'],
                lag_steps_count=self.prediction_params['lags']
            )
            if feature_vector_df is None:
                logger.warning("Feature preparation failed for prediction.")
                return None, None

            # Make prediction with XGBoost models
            try:
                 dmatrix = xgb.DMatrix(feature_vector_df, feature_names=self.predictor_features)
                 pred_temp = self.temp_model.predict(dmatrix)
                 pred_humid = self.humid_model.predict(dmatrix)
            except ValueError as ve:
                 logger.error(f"Prediction DMatrix error: {ve}"); return None, None
            except Exception as pred_err:
                 logger.exception(f"Error during XGBoost prediction: {pred_err}"); return None, None

            # Process results
            predicted_temperature = float(pred_temp[0])
            predicted_humidity = max(0.0, min(100.0, float(pred_humid[0]))) # Clamp humidity 0-100
            logger.info(f"Prediction ({self.prediction_params['horizon']}m ahead): Temp={predicted_temperature:.1f}C, Humid={predicted_humidity:.1f}%") # Important output
            return predicted_temperature, predicted_humidity
        except Exception as e:
            logger.exception(f"Prediction pipeline error: {e}")
            return None, None


# --- MQTT Callbacks (V2 Signatures) ---
def on_connect(client, userdata, flags, reason_code, properties): #
    """Callback when the client connects to the MQTT broker."""
    connect_reason_str = str(reason_code) # Get string representation
    if reason_code == 0:
        logger.info("MQTT Connected") # Important status
        try:
            # Subscribe to sensor topic
            result, mid = client.subscribe(SENSOR_TELEMETRY_TOPIC, qos=1)
            if result == mqtt.MQTT_ERR_SUCCESS:
                 logger.debug(f"MQTT Subscribed OK: '{SENSOR_TELEMETRY_TOPIC}'")
            else:
                 logger.error(f"MQTT Subscription failed '{SENSOR_TELEMETRY_TOPIC}': {mqtt.error_string(result)}")
        except Exception as sub_e:
            logger.exception(f"MQTT Subscription error: {sub_e}")
    else:
        # Log the specific failure reason
        logger.error(f"MQTT Connection failed: {connect_reason_str}")

# Added properties=None for robust V2 callback handling
def on_disconnect(client, userdata, disconnect_flags, reason_code, properties):
    if reason_code == 0:
        logger.info("MQTT Disconnected normally.")
    else:
        logger.warning(f"MQTT Unexpected disconnection: Reason Code={reason_code}")

def on_publish(client, userdata, mid, reason_code, properties):
    if reason_code == 0:
         logger.debug(f"MQTT Published message id: {mid} successfully")
    else:
         logger.warning(f"MQTT Publish failed for mid {mid}: {reason_code}")

def on_message(client, userdata, msg): #
    """Callback when a message is received from the broker."""
    global sensor_history
    logger.debug(f"MQTT Message received on topic '{msg.topic}'")
    if msg.topic == SENSOR_TELEMETRY_TOPIC:
        try:
            payload_str = msg.payload.decode('utf-8')
            data = json.loads(payload_str)
            temp_str = data.get("temperature")
            humid_str = data.get("humidity")
            if temp_str is not None and humid_str is not None:
                timestamp = datetime.datetime.now(datetime.timezone.utc)
                try:
                    temp_float = float(temp_str)
                    humid_float = float(humid_str)
                    sensor_history.append((timestamp, temp_float, humid_float))
                    logger.debug(f"MQTT sensor data added. History size: {len(sensor_history)}")
                except (ValueError, TypeError) as convert_err:
                    logger.warning(f"MQTT data conversion error: {convert_err}. Data: T='{temp_str}', H='{humid_str}'")
            else:
                 logger.warning(f"Missing 'temperature' or 'humidity' in MQTT payload: {data}")
        except json.JSONDecodeError:
            logger.warning(f"MQTT JSON Decode Error: {msg.payload.decode('utf-8', errors='ignore')}")
        except Exception as e:
            logger.warning(f"MQTT message processing error: {e}")
    else:
        logger.debug(f"MQTT message ignored on unhandled topic '{msg.topic}'")


# ==============================================================================
#                                Main Execution
# ==============================================================================
if __name__ == '__main__': #

    mqtt_client = None

    try:
        # Initialize AI Manager
        ai_manager = AiManager() # Uses default config path "config/ai_config.json"

        # --- MQTT Setup ---
        client_id = f"sh-client-{uuid.uuid4()}"
        mqtt_client = mqtt.Client(
            client_id=client_id,
            protocol=mqtt.MQTTv311,
            callback_api_version=CallbackAPIVersion.VERSION2
        )
        if not MQTT_TOKEN:
            logger.warning("MQTT Token environment variable not set. Connection likely requires a token.")
        else:
            mqtt_client.username_pw_set(username=MQTT_TOKEN, password=None)  

        # Assign callback functions
        mqtt_client.on_connect = on_connect
        mqtt_client.on_disconnect = on_disconnect
        mqtt_client.on_publish = on_publish
        mqtt_client.on_message = on_message

        # Attempt connection
        try:
            logger.info(f"MQTT Connecting to {MQTT_BROKER}:{MQTT_PORT} with Client ID '{client_id}'...")
            mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 30)
            mqtt_client.loop_start() # Start background thread for MQTT network traffic
            logger.debug("MQTT Network loop started.")
        except Exception as mqtt_e:
             logger.exception(f"MQTT Connection error: {mqtt_e}")
             mqtt_client = None # Ensure client is None if connection fails
             logger.warning("Proceeding without MQTT connection.")

        # --- Main Loop Setup ---
        last_prediction_time = 0
        # Get prediction interval from config, default to 15s
        prediction_interval_seconds = ai_manager.config.get("prediction", {}).get("prediction_interval_seconds", 15)

        # --- Option 1: Run Voice Control Loop ---
        if ai_manager.voice_enabled:
            logger.info("--- Voice Control Active (Online STT) ---") # Important status
            if not ai_manager.speech_recognizer:
                logger.error("Speech Recognizer component not initialized.")
                raise SystemExit("Voice init failed.")

            # Get microphone sample rate from config
            mic_sample_rate = ai_manager.config.get("voice_control", {}).get("mic_sample_rate", 16000)
            run_voice_loop = True

            try:
                # Setup Microphone
                microphone = sr.Microphone(sample_rate=mic_sample_rate)
                with microphone as source:
                    logger.debug("Adjusting for ambient noise...")
                    ai_manager.speech_recognizer.adjust_for_ambient_noise(source, duration=1)
                    logger.info(f"Ready! Listening...") # Important status

                last_activity_time = time.time()

                # Start Voice Loop
                while run_voice_loop:

                    # --- Prediction Check ---
                    current_time = time.time()
                    if ai_manager.prediction_enabled and (current_time - last_prediction_time) >= prediction_interval_seconds:
                         logger.info("--- Making Prediction ---") # Important status
                         pred_temp, pred_humid = ai_manager.make_prediction()
                         # Publish prediction as attribute if successful and connected
                         if pred_temp is not None and mqtt_client and mqtt_client.is_connected():
                             try:
                                 pred_payload_dict = {"predicted_temp": round(pred_temp, 2), "predicted_humid": round(pred_humid, 2)}
                                 mqtt_client.publish(ATTRIBUTE_TOPIC, json.dumps(pred_payload_dict), qos=1)
                                 logger.debug(f"Published prediction attribute: {pred_payload_dict}")
                             except Exception as pub_err:
                                 logger.error(f"Failed to publish prediction attribute: {pub_err}")
                         last_prediction_time = current_time

                    # --- Voice Listening ---
                    logger.debug("Listening for command...")
                    audio_data = None
                    try:
                        # Listen for audio via microphone
                        with microphone as source:
                             audio_data = ai_manager.speech_recognizer.listen(source, timeout=5, phrase_time_limit=10)
                        logger.debug("Audio captured, processing...")
                        last_activity_time = time.time() # Reset inactivity timer

                    except sr.WaitTimeoutError:
                        # Handle silence / inactivity timeout
                        current_time = time.time()
                        if (current_time - last_activity_time) > INACTIVITY_TIMEOUT_SECONDS:
                            logger.info("Inactivity timeout reached. Stopping voice loop.") # Important status
                            run_voice_loop = False
                        else:
                            logger.debug(f"Silence...") # Log silence if needed
                            time.sleep(0.2) # Prevent busy-waiting during silence
                        continue # Go back to listening or exit loop

                    except sr.RequestError as e: # Handle errors from speech_recognition library itself
                        logger.error(f"SR listen error: {e}"); run_voice_loop = False; continue
                    except Exception as listen_err:
                        logger.exception(f"Audio listening error: {listen_err}"); time.sleep(1); continue

                    # --- Process Captured Audio ---
                    if audio_data:
                        recognized_text = ""
                        try:
                            # Use Google Web Speech API via speech_recognition library
                            logger.debug("Sending audio to Google Web Speech API...")
                            recognized_text = ai_manager.speech_recognizer.recognize_google(
                                audio_data, language='en-US' # Set language
                            ).lower() # Convert to lowercase
                            logger.info(f"Recognized: '{recognized_text}'") # Important output

                        except sr.UnknownValueError: # API could not understand audio
                            logger.debug("Could not understand audio")
                            continue # Ignore and listen again
                        except sr.RequestError as e: # API unavailable or network error
                            logger.warning(f"Could not request results from STT service; {e}")
                            time.sleep(2) # Wait before retrying
                            continue
                        except Exception as recog_err: # Other unexpected STT errors
                            logger.exception(f"Online STT error: {recog_err}")
                            continue

                        # --- Interpret Recognized Text ---
                        if recognized_text:
                            # Use voice_interpreter module
                            status, payload = ai_manager.interpret_text_command(recognized_text)
                            logger.info(f"  -> Interpreted: {status}, Payload: {payload}") # Important output

                            # --- Publish Command as Attribute ---
                            if status == voice_interpreter.STATUS_OK and payload and mqtt_client and mqtt_client.is_connected(): #
                                 try:
                                     # Create attribute payload (publishing the interpreted structure)
                                     # --- OLD CODE ---
                                     # attribute_payload_dict = {"last_command_payload": payload}
                                     # message_json = json.dumps(attribute_payload_dict)
                                     # --- END OLD CODE ---

                                     # --- NEW CODE ---
                                     # Directly use the payload returned by interpret_command,
                                     # which should be like {"sharevalueFan": True}
                                     message_json = json.dumps(payload)
                                     # --- END NEW CODE ---

                                     logger.info(f"Publishing Attribute: {message_json} to {ATTRIBUTE_TOPIC}") # Important action
                                     # Publish to the standard attribute topic
                                     mqtt_client.publish(ATTRIBUTE_TOPIC, message_json, qos=1)

                                 except Exception as pub_e:
                                     logger.exception(f"Attribute publishing error: {pub_e}")

                            elif status == voice_interpreter.STATUS_OK and payload and (not mqtt_client or not mqtt_client.is_connected()):
                                 logger.warning("Command OK, but MQTT client not connected.")

                            # --- Handle Stop Command ---
                            if status == voice_interpreter.STATUS_STOP: #
                                logger.info("Stop command received. Exiting voice loop.") # Important status
                                run_voice_loop = False
                    # --- End of audio processing ---

                logger.info("Exited voice control loop.") # Important status

            # --- Exception Handling for Voice Loop ---
            except sr.RequestError as e: logger.error(f"SR setup/run error: {e}")
            except OSError as e: logger.error(f"Microphone OS error: {e}"); print("\nERROR: Microphone not found or access denied.")
            except Exception as e: logger.exception(f"Voice loop error: {e}")

        # --- Option 2: Run Prediction-Only Loop ---
        elif ai_manager.prediction_enabled:
             logger.info("Voice disabled. Running prediction-only loop...") # Important status
             while True:
                 current_time = time.time()
                 if (current_time - last_prediction_time) >= prediction_interval_seconds:
                     logger.info("--- Making Prediction ---") # Important status
                     ai_manager.make_prediction()
                     last_prediction_time = current_time
                     logger.debug(f"(Prediction loop run. Next check in {prediction_interval_seconds}s.)")
                 try: time.sleep(1)
                 except KeyboardInterrupt: logger.info("Ctrl+C detected. Exiting prediction loop."); break # Important status

        else:
            # If neither voice nor prediction is enabled
            logger.info("Voice control and prediction disabled. Exiting.") # Important status


    # --- Error Handling & Cleanup ---
    except FileNotFoundError as e: logger.error(f"{e}. Check config/model paths.")
    except SystemExit as e: logger.info(f"Exiting: {e}") # e.g. "Voice init failed."
    except KeyboardInterrupt: logger.info("\nCtrl+C received during setup/run. Exiting.")
    except ValueError as e: # Catch specific config errors like missing token/clientid
        logger.error(f"Configuration error: {e}")
    except Exception as e: logger.exception(f"Unexpected main level error: {e}")

    finally:
        # --- Cleanup ---
        if mqtt_client and mqtt_client.is_connected():
            logger.info("MQTT Disconnecting...") # Important status
            mqtt_client.loop_stop() # Stop background network thread
            mqtt_client.disconnect() # Send MQTT disconnect packet
            # on_disconnect callback should log "MQTT Disconnected"
        logger.info("Application finished.") # Important status