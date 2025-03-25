import serial
import serial.tools.list_ports
import paho.mqtt.client as mqttclient
import json
import time
import threading
import socket
import queue
from pymongo import MongoClient

# CoreIOT Configuration
COREIOT_BROKER = "app.coreiot.io"
COREIOT_PORT = 1883
COREIOT_ACCESS_TOKEN = "ZS9KjbmsPcXtniB8q9yP"
COREIOT_ACCESS_USERNAME = "IOT_DEVICE_1"

# YoloUno Serial Configuration
BAUD_RATE = 115200
POTENTIAL_PORTS = ["COM12", "COM3", "COM4", "COM5"]

# Server Configuration
HOST = ''  # Lắng nghe trên tất cả các địa chỉ IP
PORT = 12345  # Cổng nhận kết nối từ ESP32-S3

# MongoDB Configuration
MONGO_URI = "mongodb+srv://tanbanquyen:Fqvqx1311@cluster0.joez7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["iot-device"]
collection = db["time-device-working"]

# Define BrokenPipeError for Python 2 compatibility
try:
    BrokenPipeError
except NameError:
    BrokenPipeError = IOError

class IOTGateway:
    def __init__(self, connection_type='wifi'):
        # CoreIOT MQTT Client Setup
        self.coreiot_client = mqttclient.Client(
            client_id="IOT_GATEWAY",
            clean_session=True,
            callback_api_version=mqttclient.CallbackAPIVersion.VERSION2
        )
        self.coreiot_client.username_pw_set(COREIOT_ACCESS_TOKEN)
        self.coreiot_client.on_connect = self.on_coreiot_connect
        self.coreiot_client.on_message = self.on_coreiot_message

        # Connection Setup
        self.connection_type = connection_type
        self.serial_connection = None
        self.serial_port = None
        self.wifi_socket = None
        self.connection_queue = queue.Queue()
        self.data_queue = queue.Queue()  # Hàng đợi để lưu trữ dữ liệu từ YoloUno

        # Flags and data storage
        self.is_connected = False
        self.latest_sensor_data = {}

    def find_yolouno_port(self):
        """Tìm cổng Serial cho YoloUno hoặc kết nối WiFi"""
        if self.connection_type == 'serial':
            for port in POTENTIAL_PORTS:
                try:
                    ser = serial.Serial(port, BAUD_RATE, timeout=1)
                    print(f"Kết nối thành công với cổng {port}")
                    return ser, port
                except (serial.SerialException, FileNotFoundError):
                    continue
            ports = list(serial.tools.list_ports.comports())
            for port in ports:
                try:
                    ser = serial.Serial(port.device, BAUD_RATE, timeout=1)
                    print(f"Kết nối thành công với cổng {port.device}")
                    return ser, port.device
                except (serial.SerialException, FileNotFoundError):
                    continue
            print("Không tìm thấy cổng kết nối cho YoloUno")
            return None, None
        elif self.connection_type == 'wifi':
            try:
                if self.wifi_socket is None:
                    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                    server_socket.bind((HOST, PORT))
                    server_socket.listen(1)
                print("IoT Gateway đang chờ kết nối... (Nhấn Ctrl+C để dừng)")

                while True:
                    try:
                        conn, addr = server_socket.accept()
                        print(f"Kết nối từ ESP32-S3: {addr}")
                        conn.settimeout(2.0)
                        self.connection_queue.put((conn, addr))
                        break
                    except socket.timeout:
                        continue
            except Exception as e:
                print(f"WiFi Connection Error: {e}")
                self.connection_queue.put((None, None))

    def connect_coreiot(self):
        """Establish connection to CoreIOT MQTT Broker"""
        try:
            self.coreiot_client.connect(COREIOT_BROKER, COREIOT_PORT)
            self.coreiot_client.loop_start()
        except Exception as e:
            print(f"CoreIOT Connection Error: {e}")

    def connect_yolouno(self):
        """Establish connection with YoloUno"""
        if self.connection_type == 'serial':
            self.serial_connection, self.serial_port = self.find_yolouno_port()
            if self.serial_connection:
                print(f"Connected to YoloUno on {self.serial_port}")
                return True
        elif self.connection_type == 'wifi':
            threading.Thread(target=self.find_yolouno_port, daemon=True).start()
            while True:
                try:
                    self.wifi_socket, self.serial_port = self.connection_queue.get()
                    if self.wifi_socket:
                        print(f"Connected to ESP32-S3 on {self.serial_port}")
                        return True
                except queue.Empty:
                    continue
        return False

    def on_coreiot_connect(self, client, userdata, flags, rc, props):
        """Callback when connected to CoreIOT"""
        if rc == 0:
            print("Connected to CoreIOT successfully!")
            client.subscribe("v1/devices/me/rpc/request/+")
            self.is_connected = True
        else:
            print("CoreIOT Connection Failed")

    def on_coreiot_message(self, client, userdata, message):
        """Handle messages from CoreIOT"""
        try:
            payload = json.loads(message.payload.decode("utf-8"))
            print(f"Received from CoreIOT: {payload}")
            if 'method' in payload:
                if payload['method'] == 'setValue':
                    self.forward_command_to_yolouno(payload)
        except Exception as e:
            print(f"CoreIOT Message Processing Error: {e}")

    def forward_command_to_yolouno(self, command):
        """Forward commands from CoreIOT to YoloUno"""
        if self.connection_type == 'serial' and self.serial_connection and self.serial_connection.is_open:
            try:
                self.serial_connection.write(json.dumps(command).encode('utf-8'))
                print(f"Forwarded command to YoloUno: {command}")
            except Exception as e:
                print(f"Error forwarding command: {e}")
        elif self.connection_type == 'wifi' and self.wifi_socket:
            try:
                self.wifi_socket.sendall(json.dumps(command).encode('utf-8'))
                print(f"Forwarded command to ESP32-S3: {command}")
            except Exception as e:
                print(f"Error forwarding command: {e}")

    def read_yolouno_data(self):
        """Liên tục đọc dữ liệu từ YoloUno và đưa vào hàng đợi"""
        count_timeout = 0
        while True:
            try:
                if self.connection_type == 'wifi' and self.wifi_socket:
                    try:
                        data = self.wifi_socket.recv(1024).decode().strip()
                        if data:
                            print(f"Dữ liệu từ ESP32-S3: {data}")
                            self.data_queue.put(data)
                            response = f"Gateway đã nhận: {data}"
                            self.wifi_socket.sendall(response.encode())
                            count_timeout = 0
                        else:
                            raise ConnectionResetError("ESP32-S3 đã đóng kết nối")
                    except socket.timeout:
                        count_timeout += 1
                        print(f"Timeout khi nhận dữ liệu từ ESP32-S3 [{count_timeout}]")
                        if count_timeout >= 10:
                            count_timeout = 0
                            self.wifi_socket.close()
                            self.wifi_socket = None
                            print("ESP32-S3 không phản hồi, đóng kết nối.")
                            raise ConnectionResetError("ESP32-S3 không phản hồi")
                elif self.connection_type == 'wifi' and not self.wifi_socket:
                    print("Kết nối với ESP32-S3 đã đóng.")
                    if self.connect_yolouno():
                        print("Kết nối lại thành công.")
                        count_timeout = 0
                    else:
                        time.sleep(2)
            except Exception as e:
                print(f"Lỗi đọc dữ liệu YoloUno: {e}")
                if self.wifi_socket:
                    self.wifi_socket.close()
                self.wifi_socket = None
                time.sleep(2)

    def process_yolouno_data(self):
        """Continuously process data from queue and forward to CoreIOT and MongoDB"""
        while True:
            try:
                data = self.data_queue.get()
                sensor_data = self.parse_sensor_data(data)
                if sensor_data:
                    # Cập nhật dữ liệu mới nhất
                    self.latest_sensor_data.update(sensor_data)
                    # Gửi lên CoreIOT
                    self.coreiot_client.publish(
                        'v1/devices/me/telemetry',
                        json.dumps(sensor_data),
                        qos=1
                    )
                    # Lưu vào MongoDB
                    try:
                        sensor_data_with_timestamp = sensor_data.copy()
                        sensor_data_with_timestamp['timestamp'] = time.time()
                        collection.insert_one(sensor_data_with_timestamp)
                        print(f"Dữ liệu đã được lưu vào MongoDB: {sensor_data_with_timestamp}")
                    except Exception as e:
                        print(f"Lỗi khi lưu vào MongoDB: {e}")
            except Exception as e:
                print(f"Data Processing Error: {e}")
            time.sleep(0.1)

    def parse_sensor_data(self, data):
        """Parse incoming data from YoloUno"""
        try:
            parsed_data = json.loads(data)
            return parsed_data
        except json.JSONDecodeError:
            print(f"Không thể phân tích dữ liệu: {data}")
            return None

    def run_ai_prediction(self):
        """Run AI model for predictions"""
        while True:
            try:
                if self.latest_sensor_data:
                    prediction = self.simple_ai_prediction(self.latest_sensor_data)
                    print(f"AI Prediction: {prediction}")
                    self.coreiot_client.publish(
                        'v1/devices/me/attributes',
                        json.dumps({'ai_prediction': prediction}),
                        qos=1
                    )
            except Exception as e:
                print(f"AI Prediction Error: {e}")
            time.sleep(5)

    def simple_ai_prediction(self, data):
        """Simple AI prediction placeholder"""
        if 'temperature' in data:
            return 'High Temperature' if data['temperature'] > 50 else 'Normal Temperature'
        return 'No Prediction'

    def start(self):
        """Start the IOT Gateway"""
        self.connect_coreiot()
        if not self.connect_yolouno():
            print("Không thể kết nối với YoloUno. Đang thoát.")
            return
        threads = [
            threading.Thread(target=self.read_yolouno_data, daemon=True),
            threading.Thread(target=self.process_yolouno_data, daemon=True),
            threading.Thread(target=self.run_ai_prediction, daemon=True)
        ]
        for thread in threads:
            thread.start()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nGateway Stopped.")
        finally:
            if self.serial_connection:
                self.serial_connection.close()
            if self.wifi_socket:
                self.wifi_socket.close()
            self.coreiot_client.disconnect()
            mongo_client.close()
            print("Đã đóng kết nối MongoDB.")

def main():
    gateway = IOTGateway(connection_type='wifi')
    gateway.start()

if __name__ == "__main__":
    main()