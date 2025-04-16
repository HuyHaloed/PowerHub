# PowerHub/data_processing/__init__.py
import serial
import serial.tools.list_ports # Keep if needed elsewhere, otherwise remove if only SensorHandler uses serial directly
import paho.mqtt.client as mqttclient
import json
import time
import threading
import speech_recognition as sr # <-- Voice import
from .sensor_handler import SensorHandler # <-- Import SensorHandler

class DataProcessingManager:
    def __init__(self,
                 broker="app.coreiot.io",
                 port=1883,
                 access_token="rsoMvGsRuM9iNbDZBZd3", # Replace with your actual token if different
                 serial_port="COM12", # Default serial port for SensorHandler (YoloUno)
                 baud_rate=115200):   # Baud rate for SensorHandler
        """
        Khởi tạo quản lý xử lý dữ liệu

        :param broker: Địa chỉ MQTT broker
        :param port: Cổng kết nối MQTT
        :param access_token: Token truy cập CoreIOT
        :param serial_port: Cổng serial cho SensorHandler (YoloUno)
        :param baud_rate: Tốc độ baud cho SensorHandler
        """
        # CoreIOT connection config
        self.broker = broker
        self.port = port
        self.access_token = access_token

        # MQTT Client Setup
        self.mqtt_client = None
        self.is_mqtt_connected = False

        # Sensor Handler Setup (using the imported class)
        self.sensor_handler = SensorHandler(serial_port=serial_port, baud_rate=baud_rate)

        # Voice Control Setup
        self.voice_recognizer = sr.Recognizer()
        self.voice_microphone = sr.Microphone()
        self.voice_stop_flag = threading.Event() # To signal all threads to stop

        # AI Model Data Cache
        self.latest_sensor_data_for_ai = {} # Store latest validated data for AI

        # Thread lock if needed for shared resources (AI model?) - Example
        # self.ai_lock = threading.Lock()


    def connect_mqtt(self):
        """Kết nối đến MQTT Broker"""
        try:
            # Use a unique client ID, incorporating the access token may help on some brokers
            # client_id = f"DataProcessingManager_{self.access_token[:6]}_{int(time.time())}"
            client_id = "DataProcessingManager_PowerHub" # Or a fixed ID if preferred
            self.mqtt_client = mqttclient.Client(client_id)
            self.mqtt_client.username_pw_set(self.access_token) # Use token as username

            # --- Define Nested Callbacks ---
            def on_connect(client, userdata, flags, rc, properties=None): # Added properties for v2 compatibility
                if rc == 0:
                    print("[MQTT] Kết nối MQTT thành công!")
                    self.is_mqtt_connected = True
                    # Subscribe to necessary topics
                    client.subscribe("v1/devices/me/rpc/request/+") # For receiving commands
                    print("[MQTT] Đã đăng ký nhận RPC requests.")
                    # Add subscription for attribute responses if integrating AttributeManager functionality
                    # client.subscribe("v1/devices/me/attributes/response/+")
                else:
                    print(f"[MQTT] Kết nối MQTT thất bại. Mã lỗi: {rc}")
                    self.is_mqtt_connected = False # Ensure flag is False on failure

            def on_message(client, userdata, message):
                """Xử lý tin nhắn nhận được"""
                print(f"[MQTT] Nhận tin nhắn trên topic: {message.topic}")
                try:
                    payload_str = message.payload.decode("utf-8")
                    payload = json.loads(payload_str)
                    print(f"[MQTT] Dữ liệu nhận được: {payload}")

                    # Check if it's an RPC request
                    if message.topic.startswith("v1/devices/me/rpc/request/"):
                        self._process_command(payload)

                    # Add handling for attribute responses if integrating AttributeManager
                    # elif message.topic.startswith("v1/devices/me/attributes/response/"):
                    #     self._handle_attribute_response(payload)

                except json.JSONDecodeError:
                     print(f"[MQTT] Lỗi giải mã JSON từ payload: {payload_str}")
                except Exception as e:
                    print(f"[MQTT] Lỗi xử lý tin nhắn: {e}")

            def on_disconnect(client, userdata, rc, properties=None): # Added properties
                 print(f"[MQTT] Đã ngắt kết nối MQTT. Mã lỗi: {rc}")
                 self.is_mqtt_connected = False
                 # Optional: Implement reconnection logic here if needed

            # Assign callbacks
            self.mqtt_client.on_connect = on_connect
            self.mqtt_client.on_message = on_message
            self.mqtt_client.on_disconnect = on_disconnect

            # Attempt connection
            print(f"[MQTT] Đang kết nối đến {self.broker}:{self.port}...")
            self.mqtt_client.connect(self.broker, self.port, keepalive=60)
            self.mqtt_client.loop_start() # Start background network loop
        except Exception as e:
            print(f"[MQTT] Lỗi khởi tạo hoặc kết nối MQTT: {e}")

    def _process_command(self, command):
        """
        Xử lý các lệnh điều khiển nhận từ MQTT và gửi qua SensorHandler.
        """
        print(f"[CMD] Xử lý lệnh RPC: {command}")
        try:
            # Example: Check for the specific 'setValue' method used before
            if command.get('method') == 'setValue':
                # Pass the whole command payload to the device sending method
                self.send_command_to_device(command)
            else:
                 print(f"[CMD] Không nhận dạng được phương thức RPC: {command.get('method')}")
            # Add handling for other RPC methods if needed
        except Exception as e:
            print(f"[CMD] Lỗi xử lý lệnh RPC: {e}")

    def send_command_to_device(self, command_payload: dict):
        """
        Interface method to send commands using the SensorHandler.
        """
        print(f"[DataProcMgr] Chuyển tiếp lệnh đến SensorHandler: {command_payload}")
        success = self.sensor_handler.send_command(command_payload)
        if not success:
            print("[DataProcMgr] Gửi lệnh qua SensorHandler thất bại.")
        # Potentially send RPC response back to CoreIOT here indicating success/failure


    def read_and_publish_sensor_data(self):
        """
        Periodically gets latest data from SensorHandler and publishes to MQTT.
        Runs in its own thread.
        """
        print("[Telemetry] Luồng gửi Telemetry bắt đầu.")
        while not self.voice_stop_flag.is_set():
            try:
                latest_data = self.sensor_handler.get_latest_sensor_data()

                if latest_data:
                    publish_data = {}
                    # Map keys for CoreIOT/ThingsBoard if needed
                    if latest_data.get('temperature') is not None:
                         publish_data['temperature'] = latest_data['temperature']
                    if latest_data.get('humidity') is not None:
                         publish_data['humidity'] = latest_data['humidity']
                    if latest_data.get('light_intensity') is not None:
                         publish_data['light'] = latest_data['light_intensity']
                    if latest_data.get('power_consumption') is not None:
                         publish_data['power'] = latest_data['power_consumption']

                    # Update local cache for AI only if there's valid data
                    if publish_data:
                         self.latest_sensor_data_for_ai = latest_data.copy() # Use the raw keys for AI

                    # Publish to MQTT if connected and data exists
                    if self.is_mqtt_connected and publish_data:
                        payload_json = json.dumps(publish_data)
                        # print(f"[Telemetry] Đang gửi: {payload_json}") # Optional debug print
                        self.mqtt_client.publish(
                            'v1/devices/me/telemetry',
                            payload_json,
                            qos=1
                        )
            except Exception as e:
                print(f"[Telemetry] Lỗi trong luồng gửi telemetry: {e}")

            time.sleep(5) # Interval for sending telemetry (e.g., 5 seconds)
        print("[Telemetry] Luồng gửi Telemetry đã dừng.")


    def run_data_prediction(self):
        """ Chạy dự đoán dữ liệu (placeholder AI) """
        print("[AI] Luồng dự đoán AI bắt đầu.")
        while not self.voice_stop_flag.is_set():
            try:
                # Make a local copy to avoid race conditions if data updates while predicting
                current_data_for_ai = self.latest_sensor_data_for_ai.copy()

                if current_data_for_ai:
                    # --- Replace _simple_prediction with call to ai_model.py ---
                    # Example:
                    # from .ai_model import perform_prediction # Assuming ai_model.py is in same dir
                    # prediction = perform_prediction(current_data_for_ai)
                    # --- Using placeholder for now ---
                    prediction = self._simple_prediction(current_data_for_ai)

                    if prediction is not None: # Only publish if a prediction was made
                         # print(f"[AI] Dự đoán: {prediction}") # Optional debug print
                         if self.is_mqtt_connected:
                             self.mqtt_client.publish(
                                 'v1/devices/me/attributes', # Publish as device attribute
                                 json.dumps({'prediction': prediction}),
                                 qos=1
                             )
            except Exception as e:
                print(f"[AI] Lỗi trong luồng dự đoán AI: {e}")

            time.sleep(10) # Interval for running prediction (e.g., 10 seconds)
        print("[AI] Luồng dự đoán AI đã dừng.")


    def _simple_prediction(self, data):
        """ Dự đoán đơn giản dựa trên dữ liệu (Placeholder) """
        temp = data.get('temperature') # Use .get for safety
        if temp is not None:
            try:
                # Ensure temp is a number
                temp_float = float(temp)
                return 'Nhiệt độ cao' if temp_float > 30 else 'Nhiệt độ bình thường' # Adjusted threshold
            except (ValueError, TypeError):
                 print(f"[AI] Dữ liệu nhiệt độ không hợp lệ cho dự đoán: {temp}")
                 return None # Cannot predict with invalid data
        return None # No temperature data, no prediction


    def _voice_control_loop(self, inactivity_timeout=30):
        """Voice control loop running as a method."""
        print("[VoiceCtrl] Bắt đầu vòng lặp điều khiển giọng nói...")
        last_activity_time = time.time()

        # Adjust for ambient noise once at the start
        try:
            with self.voice_microphone as source:
                    print("[VoiceCtrl] Đang điều chỉnh tiếng ồn xung quanh...")
                    self.voice_recognizer.adjust_for_ambient_noise(source, duration=1)
                    print("[VoiceCtrl] Điều chỉnh tiếng ồn hoàn tất.")
        except Exception as e:
            print(f"[VoiceCtrl] Lỗi khi điều chỉnh tiếng ồn: {e}. Tiếp tục mà không điều chỉnh.")
            # Depending on the error, might want to stop here. sr.WaitTimeoutError is common if mic is busy.


        while not self.voice_stop_flag.is_set():
            current_time = time.time()

            # Check for inactivity timeout
            if current_time - last_activity_time > inactivity_timeout:
                print(f"\n[VoiceCtrl] Không phát hiện hoạt động trong {inactivity_timeout} giây. Dừng...")
                self.voice_stop_flag.set()
                break

            print("[VoiceCtrl] Đang nghe...")
            recognized_text = None
            speech_was_detected = False

            # Listen
            try:
                with self.voice_microphone as source:
                    # Consider using dynamic energy threshold if adjust_for_ambient_noise fails often
                    # self.voice_recognizer.dynamic_energy_threshold = True
                    audio = self.voice_recognizer.listen(source, timeout=5, phrase_time_limit=5)
                    speech_was_detected = True
            except sr.WaitTimeoutError:
                # This is normal if no one is speaking, don't print error unless debugging
                # print("[VoiceCtrl] Không phát hiện giọng nói trong thời gian chờ.")
                time.sleep(0.5)
                continue # Continue loop without resetting activity timer
            except Exception as e:
                 print(f"[VoiceCtrl] Lỗi khi nghe: {e}")
                 time.sleep(1) # Pause before retrying
                 continue


            # Recognize only if speech was detected
            if speech_was_detected:
                last_activity_time = time.time() # Reset timer
                try:
                    print("[VoiceCtrl] Đang nhận dạng...")
                    recognized_text = self.voice_recognizer.recognize_google(audio).lower()
                    print(f"[VoiceCtrl] Bạn đã nói: {recognized_text}")
                except sr.RequestError as e:
                    print(f"[VoiceCtrl] Lỗi API: {e}")
                except sr.UnknownValueError:
                    print("[VoiceCtrl] Không thể nhận dạng giọng nói.")
                except Exception as e:
                     print(f"[VoiceCtrl] Lỗi nhận dạng không xác định: {e}")


            # Process Command only if text was recognized
            if recognized_text:
                command_to_send = None
                stop_requested = False

                # Check for STOP command first
                if recognized_text == "stop" or "stop listening" in recognized_text:
                    print("[VoiceCtrl] Nhận dạng lệnh: Dừng Nghe")
                    stop_requested = True

                # Other commands (Case insensitive checks using 'in')
                elif "turn on light" in recognized_text:
                    print("[VoiceCtrl] Nhận dạng lệnh: Bật Đèn")
                    command_to_send = {'method': 'setValue', 'params': {'light': True}}
                elif "turn off light" in recognized_text:
                    print("[VoiceCtrl] Nhận dạng lệnh: Tắt Đèn")
                    command_to_send = {'method': 'setValue', 'params': {'light': False}}
                elif "turn on fan" in recognized_text:
                    print("[VoiceCtrl] Nhận dạng lệnh: Bật Quạt")
                    command_to_send = {'method': 'setValue', 'params': {'fan': True}}
                elif "turn off fan" in recognized_text:
                    print("[VoiceCtrl] Nhận dạng lệnh: Tắt Quạt")
                    command_to_send = {'method': 'setValue', 'params': {'fan': False}}
                else:
                    print("[VoiceCtrl] Lệnh không được nhận dạng.")

                # Send command if matched
                if command_to_send:
                     self.send_command_to_device(command_to_send)

                # Signal stop if requested
                if stop_requested:
                    print("[VoiceCtrl] Nhận được lệnh dừng. Dừng...")
                    self.voice_stop_flag.set()
                    break # Exit voice loop immediately

        print("[VoiceCtrl] Vòng lặp điều khiển giọng nói đã kết thúc.")


    def start(self):
        """Khởi động Data Processing Manager và tất cả các luồng."""
        print("--- Khởi tạo Data Processing Manager ---")
        # 1. Kết nối MQTT
        self.connect_mqtt()

        # 2. Kết nối Serial qua SensorHandler và bắt đầu đọc trong luồng riêng
        print("[Main] Đang khởi động SensorHandler...")
        if not self.sensor_handler.start_reading():
            print("[Main] LỖI: Không thể khởi động SensorHandler. Thoát.")
            # Cleanup MQTT if already connected
            if self.mqtt_client and self.mqtt_client.is_connected():
                 self.mqtt_client.disconnect()
                 self.mqtt_client.loop_stop()
            return # Exit if serial fails
        print("[Main] SensorHandler đã bắt đầu.")

        # 3. Đợi MQTT kết nối (với timeout)
        print("[Main] Chờ kết nối MQTT...")
        mqtt_connect_timeout = 15 # seconds
        start_wait = time.time()
        while not self.is_mqtt_connected and time.time() - start_wait < mqtt_connect_timeout:
            time.sleep(0.5)

        if not self.is_mqtt_connected:
            print("[Main] LỖI: Hết thời gian chờ kết nối MQTT. Thoát.")
            self.sensor_handler.stop_reading() # Stop sensor thread
            return # Exit if MQTT fails

        print("[Main] MQTT đã kết nối.")

        # 4. Tạo và khởi chạy các luồng xử lý chính
        print("[Main] Khởi chạy các luồng xử lý (Telemetry, AI, Voice)...")
        threads = [
            threading.Thread(target=self.read_and_publish_sensor_data, daemon=True, name="TelemetryThread"),
            threading.Thread(target=self.run_data_prediction, daemon=True, name="AIPredictionThread"),
            threading.Thread(target=self._voice_control_loop, daemon=True, name="VoiceControlThread")
        ]
        for thread in threads:
            thread.start()
        print("[Main] Các luồng xử lý đã bắt đầu.")

        # 5. Giữ chương trình chạy và chờ tín hiệu dừng
        print("--- Data Processing Manager đang chạy ---")
        print("(Nhấn Ctrl+C hoặc nói 'stop' để dừng)")
        try:
            # Keep main thread alive, checking the stop flag periodically
            while not self.voice_stop_flag.is_set():
                time.sleep(1) # Check every second
        except KeyboardInterrupt:
            print("\n[Main] Nhận tín hiệu KeyboardInterrupt. Bắt đầu dừng...")
            self.voice_stop_flag.set() # Signal threads to stop
        finally:
            print("[Main] Bắt đầu quá trình dọn dẹp...")
            # Chờ các luồng con kết thúc (không bắt buộc với daemon=True, nhưng tốt để đảm bảo cleanup)
            # print("[Main] Waiting for threads to potentially finish...")
            # for thread in threads:
            #     thread.join(timeout=2.0) # Give threads a couple of seconds

            # Stop sensor reading and close serial
            self.sensor_handler.stop_reading()

            # Disconnect MQTT client gracefully
            if self.mqtt_client and self.mqtt_client.is_connected():
                self.mqtt_client.loop_stop()
                self.mqtt_client.disconnect()
                print("[Main] Đã ngắt kết nối MQTT.")
            elif self.mqtt_client:
                 self.mqtt_client.loop_stop() # Stop loop even if not connected
                 print("[Main] MQTT loop stopped.")

            print("--- Data Processing Manager đã dừng hoàn toàn ---")

# --- Main execution block ---
def main():
    """Hàm chính để chạy quản lý xử lý dữ liệu"""
    # --- Determine Serial Port ---
    # This needs adjustment based on your OS and connected device
    # You might list ports and let user choose, or read from config
    import sys
    default_port = "COM12" if sys.platform == "win32" else "/dev/ttyACM0" # Example common ports
    print(f"Sử dụng cổng serial mặc định: {default_port} (Có thể cần thay đổi)")
    # Add logic here to find the correct port if needed, e.g., using serial.tools.list_ports
    # ---

    # --- Get Access Token ---
    # !! Важно (Important): Avoid hardcoding tokens directly in code !!
    # Read from environment variable, config file, or secure storage
    access_token = "rsoMvGsRuM9iNbDZBZd3" # Replace with your method of getting token
    print(f"Sử dụng Access Token: ...{access_token[-4:]}") # Show only last few chars
    # ---

    # Initialize and start the manager
    data_manager = DataProcessingManager(serial_port=default_port, access_token=access_token)
    data_manager.start()

if __name__ == "__main__":
    # Add check for necessary libraries before running main?
    try:
         import paho.mqtt.client
         import serial
         import speech_recognition
         # import pymongo # If using database
         print("Các thư viện cần thiết dường như đã được cài đặt.")
    except ImportError as e:
         print(f"LỖI: Thiếu thư viện cần thiết: {e}")
         print("Vui lòng cài đặt các thư viện bằng pip:")
         print("pip install paho-mqtt pyserial SpeechRecognition PyAudio")
         exit(1) # Exit if libraries are missing

    main()