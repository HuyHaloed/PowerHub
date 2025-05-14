import os
import ssl
import paho.mqtt.client as mqtt
import requests
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import time

# Load environment variables from .env file
load_dotenv()

# === Thiết lập từ biến môi trường hoặc giá trị mặc định ===
ADAFRUIT_USERNAME = os.getenv('ADAFRUIT_USERNAME', 'Hellosine')
ADAFRUIT_IO_KEY = os.getenv('ADAFRUIT_IO_KEY', 'aio_mStR74qgprQUBF5F3UXCTcPdIlay')

MQTT_BROKER = 'io.adafruit.com'
MQTT_PORT = 8883  # Port for MQTT with TLS
ADAFRUIT_IO_BASE_URL = "https://io.adafruit.com/api/v2"

# MongoDB connection settings from environment variables
MONGO_URI = os.getenv('MONGO_URI', "mongodb+srv://xuanhuy6a1:usA02u8ynSixe3Ve@powerhub.f6br6mk.mongodb.net/")
MONGO_DB_NAME = os.getenv('MONGO_DB', "PowerHubDb") # Renamed to avoid conflict with db object
MONGO_COLLECTION_NAME = os.getenv('MONGO_COLLECTION', "sensor_readings") # Renamed

# Initialize MongoDB client
mongo_client = None
db = None
sensor_readings_collection = None

try:
    print(f"Attempting to connect to MongoDB at {MONGO_URI}...")
    mongo_client = MongoClient(MONGO_URI, tls=True, tlsAllowInvalidCertificates=True) # tlsAllowInvalidCertificates for dev if needed
    db = mongo_client[MONGO_DB_NAME]
    sensor_readings_collection = db[MONGO_COLLECTION_NAME]
    # Test connection
    db.command('ping')
    print(f"Successfully connected to MongoDB: {MONGO_DB_NAME} / {MONGO_COLLECTION_NAME}")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    # No exit here, allow MQTT to run if user wants, but log MongoDB issue

# Khởi tạo collection mới cho PredictionData
prediction_collection = db["PredictionData"]
main_feeds = ["temperature", "humidity", "brightness", "energy"]

# === Callback khi kết nối thành công ===
def on_connect(client_instance, userdata, flags, rc):
    if rc == 0:
        print(f'Đã kết nối tới Adafruit IO MQTT Broker: {MQTT_BROKER}')
        subscribe_to_feeds()  # Subscribe to feeds after successful connection
    else:
        print(f'Kết nối MQTT lỗi, mã trả về: {rc} ({mqtt.connack_string(rc)})')

# === Callback khi có lỗi log (bao gồm error) ===
def on_log(client_instance, userdata, level, buf):
    # print(f"MQTT Log (Level: {mqtt.connack_string(level).split(':')[0]}): {buf}") # More descriptive level
    if level == mqtt.MQTT_LOG_ERR: # Log only errors to reduce noise
        print('MQTT Error:', buf)

# === Callback khi nhận message ===
def on_message(client_instance, userdata, msg):
    # Không lưu từng feed riêng lẻ nữa
    pass

# === Khởi tạo client và cấu hình TLS + xác thực ===
client = mqtt.Client() # You can specify client_id if needed: mqtt.Client(client_id="my_client_id")

# DEBUG: Print credentials being used
# print(f"[DEBUG] MQTT Using Username: '{ADAFRUIT_USERNAME}'")
# if ADAFRUIT_IO_KEY and len(ADAFRUIT_IO_KEY) > 8:
#     print(f"[DEBUG] MQTT Using AIO Key (partial): '{ADAFRUIT_IO_KEY[:4]}...{ADAFRUIT_IO_KEY[-4:]}'")
# elif ADAFRUIT_IO_KEY:
#     print(f"[DEBUG] MQTT Using AIO Key: '{ADAFRUIT_IO_KEY}' (Key is short)")
# else:
#     print("[DEBUG] MQTT AIO Key is None or empty!")

client.username_pw_set(ADAFRUIT_USERNAME, ADAFRUIT_IO_KEY)

# Use TLS for MQTT connection
# This requires MQTT_PORT to be 8883 (or other TLS port for your broker)
client.tls_set_context(ssl.create_default_context()) 

client.on_connect = on_connect
client.on_log = on_log
client.on_message = on_message

def connect_mqtt():
    """Kết nối tới MQTT broker và bắt đầu loop."""
    try:
        print(f"Connecting to MQTT Broker: {MQTT_BROKER} on port {MQTT_PORT} with TLS...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60) # 60 seconds keepalive
        client.loop_start() # Start a background thread for the MQTT network loop
        return True
    except Exception as e:
        print(f"Lỗi kết nối MQTT: {e}")
        return False

FEEDS_TO_SUBSCRIBE = ["temperature", "humidity", "brightness", "energy", "Fan", "Light", "test"]

def subscribe_to_feeds():
    """Subscribe to specified Adafruit IO feeds."""
    if not client.is_connected():
        print("MQTT client not connected. Cannot subscribe to feeds.")
        return
    for feed_name in FEEDS_TO_SUBSCRIBE:
        # Adafruit topic format: <username>/feeds/<feed_key>
        # feed_key is usually the same as feed_name but can be different if manually changed in Adafruit IO.
        # Assuming feed_name is the key here.
        topic = f"{ADAFRUIT_USERNAME}/feeds/{feed_name}"
        (result, mid) = client.subscribe(topic)
        if result == mqtt.MQTT_ERR_SUCCESS:
            print(f"Đã gửi yêu cầu subscribe vào feed: '{feed_name}' (topic: {topic}), MID: {mid}")
        else:
            print(f"Lỗi gửi yêu cầu subscribe vào feed: '{feed_name}' (topic: {topic}), Error: {mqtt.error_string(result)}")


def publish_to_feed(feed_name: str, payload: str) -> None:
    if not client.is_connected():
        print("MQTT client not connected. Cannot publish.")
        return
    if payload is None: # Or handle as an empty string if required
        print(f"Payload for feed '{feed_name}' is None. Skipping publish.")
        return
        
    topic = f"{ADAFRUIT_USERNAME}/feeds/{feed_name}"
    (result, mid) = client.publish(topic, payload) # QoS defaults to 0
    
    if result != mqtt.MQTT_ERR_SUCCESS:
        print(f'Lỗi gửi MQTT đến "{topic}": {mqtt.error_string(result)}')
    else:
        print(f'Đã gửi "{payload}" đến "{topic}" (MID: {mid})')

def get_latest_from_feed_api(feed_name: str) -> str | None:
    """Lấy giá trị mới nhất từ feed trên Adafruit IO qua HTTP API."""
    url = f"{ADAFRUIT_IO_BASE_URL}/{ADAFRUIT_USERNAME}/feeds/{feed_name}/data/last"
    headers = {"X-AIO-Key": ADAFRUIT_IO_KEY}
    try:
        print(f"Fetching latest data for '{feed_name}' from Adafruit API...")
        resp = requests.get(url, headers=headers, timeout=10) # Increased timeout
        resp.raise_for_status() # Raises HTTPError for bad responses (4XX or 5XX)
        data = resp.json()
        return data.get("value")
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error khi lấy dữ liệu từ feed '{feed_name}': {http_err}")
    except requests.exceptions.ConnectionError as conn_err:
        print(f"Connection error khi lấy dữ liệu từ feed '{feed_name}': {conn_err}")
    except requests.exceptions.Timeout as timeout_err:
        print(f"Timeout error khi lấy dữ liệu từ feed '{feed_name}': {timeout_err}")
    except requests.exceptions.RequestException as req_err:
        print(f"Lỗi Request khi lấy dữ liệu từ feed '{feed_name}': {req_err}")
    except Exception as e: # Catch any other exceptions, like JSONDecodeError
        print(f"Lỗi không xác định khi lấy dữ liệu từ feed '{feed_name}': {e}")
    return None

def get_latest_from_mongodb(feed_name: str) -> dict | None:
    """Lấy giá trị mới nhất từ MongoDB cho một feed cụ thể, lọc theo username."""
    if not sensor_readings_collection:
        print("MongoDB not connected. Cannot get latest from MongoDB.")
        return None
    try:
        # Ensure an index on {"username": 1, "feed_name": 1, "timestamp": -1} for performance
        latest_reading = sensor_readings_collection.find_one(
            {"username": ADAFRUIT_USERNAME, "feed_name": feed_name},
            sort=[("timestamp", -1)]
        )
        return latest_reading
    except Exception as e:
        print(f"Lỗi lấy dữ liệu từ MongoDB cho feed '{feed_name}': {e}")
        return None

def is_mqtt_connected() -> bool:
    """Kiểm tra client MQTT đã kết nối chưa."""
    return client.is_connected()

# --- Functions for controlling devices (examples) ---
def turn_on_fan(): publish_to_feed('Fan', 'ON')
def turn_off_fan(): publish_to_feed('Fan', 'OFF')
def turn_on_light(): publish_to_feed('Light', 'ON')
def turn_off_light(): publish_to_feed('Light', 'OFF')

def stop_mqtt_loop():
    """Dừng loop MQTT client đang chạy ngầm."""
    # if client._thread_is_running: # Check if loop_start() was called and thread is active
    print("Attempting to stop MQTT client background loop...")
    client.loop_stop() # Stops the background thread. Safe to call even if not running.
    print("MQTT client loop_stop() called.")
    # else:
    #     print("MQTT client loop was not considered to be running by the previous check.")


def disconnect_resources():
    """Ngắt kết nối MQTT và MongoDB một cách an toàn."""
    print("Disconnecting resources...")
    stop_mqtt_loop() # Stop the loop first
    
    if client.is_connected():
        print("Disconnecting MQTT client...")
        client.disconnect() # Gracefully disconnects from the broker
        print("MQTT client disconnected.")
    else:
        print("MQTT client was not connected.")
        
    if mongo_client:
        print("Closing MongoDB client connection...")
        mongo_client.close()
        print("MongoDB client connection closed.")

def snapshot_and_save_all_feeds():
    # Không lưu từng feed riêng lẻ nữa
    pass

def save_combined_snapshot():
    feeds = ["temperature", "humidity", "brightness", "energy"]
    snapshot = {}
    for feed in feeds:
        value = get_latest_from_feed_api(feed)
        try:
            value = float(value)
        except Exception:
            pass
        snapshot[feed] = value
    snapshot["timestamp"] = datetime.utcnow()
    snapshot["source"] = "adafruit_api_combined"
    snapshot["username"] = ADAFRUIT_USERNAME
    prediction_collection.insert_one(snapshot)
    print("Đã lưu snapshot tổng hợp vào PredictionData:", snapshot)

def run_mqtt_service():
    """
    Initializes and runs the MQTT service, including connecting to MQTT and MongoDB,
    and handling the main loop and shutdown.
    """
    print("Starting MQTT Service application (from run_mqtt_service)...")
    
    global db # Ensure db is accessible, though it's a module global
    global mongo_client # Ensure mongo_client is accessible

    if db is None: # Corrected condition
        print("Critical: MongoDB connection was not established. Some features might not work or script might exit.")
        # Decide if to exit or continue with MQTT only
        # exit(1) # Uncomment to exit if MongoDB is critical

    # Lấy snapshot giá trị hiện tại từ các feed và lưu vào MongoDB trước khi chạy MQTT loop
    print("Lấy snapshot giá trị hiện tại từ các feed trên Adafruit IO...")
    snapshot_and_save_all_feeds()
    print("Lưu snapshot tổng hợp vào PredictionData...")
    save_combined_snapshot()

    if connect_mqtt():
        print("MQTT Service is connected and running. Data will be logged to MongoDB.")
        print("Press Ctrl+C to stop the service.")
        
        try:
            last_snapshot = 0
            interval = 60  # số giây giữa các lần snapshot, ví dụ 60s = 1 phút
            while True:
                now = time.time()
                if now - last_snapshot > interval:
                    save_combined_snapshot()
                    last_snapshot = now
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nCtrl+C received in run_mqtt_service. Initiating shutdown sequence...")
        except Exception as e:
            print(f"An unexpected error occurred in the run_mqtt_service main loop: {e}")
        finally:
            print("Shutting down service (from run_mqtt_service)...")
            disconnect_resources()
            print("Application shut down gracefully (from run_mqtt_service).")
    else:
        print("Failed to connect to MQTT broker. Application will not run (from run_mqtt_service).")
        # Ensure MongoDB client is closed if MQTT connection failed but MongoDB was attempted
        if mongo_client:
            mongo_client.close()
            print("MongoDB client connection closed due to MQTT failure (from run_mqtt_service).")

# Main execution block: To run this script directly (e.g., python mqttservice.py)
if __name__ == '__main__':
    run_mqtt_service()