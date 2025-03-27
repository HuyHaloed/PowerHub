import socket
import json
import time
import threading
import queue
import paho.mqtt.client as mqttclient
from pymongo import MongoClient

# CoreIOT Configuration
COREIOT_BROKER = "app.coreiot.io"
COREIOT_PORT = 1883
COREIOT_ACCESS_TOKEN = "ZS9KjbmsPcXtniB8q9yP"

# Server Configuration
HOST = ''
PORT = 12345

# MongoDB Configuration
MONGO_URI = "mongodb+srv://tanbanquyen:Fqvqx1311@cluster0.joez7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["iot-device"]
collection = db["time-device-working"]

# Data Configuration
DATA_CONFIG = {
    "attributes": {"shared": ["sharedvalueLight", "sharedvalueFan"]},
    "telemetry": ["temperature", "humidity"],
    "rpc_methods": {"setValueLight": "light", "setValueFan": "fan"}
}

class IOTGateway:
    def __init__(self):
        self.running = True
        self.coreiot_client = mqttclient.Client(client_id="IOT_GATEWAY", callback_api_version=mqttclient.CallbackAPIVersion.VERSION2)
        self.coreiot_client.username_pw_set(COREIOT_ACCESS_TOKEN)
        self.coreiot_client.on_connect = self.on_coreiot_connect
        self.coreiot_client.on_message = self.on_coreiot_message
        self.wifi_socket = None
        self.data_queue = queue.Queue()
        self.shared_attributes = {"sharedvalueLight": False, "sharedvalueFan": False}
        self.lock = threading.Lock()

    def connect_coreiot(self):
        try:
            self.coreiot_client.connect(COREIOT_BROKER, COREIOT_PORT)
            self.coreiot_client.loop_start()
            print("Connected to CoreIOT")
        except Exception as e:
            print(f"CoreIOT Connection Error: {e}")

    def connect_esp32(self):
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_socket.bind((HOST, PORT))
        server_socket.listen(1)
        print("Waiting for ESP32-S3 connection...")
        while self.running:
            try:
                conn, addr = server_socket.accept()
                with self.lock:
                    if self.wifi_socket:
                        self.wifi_socket.close()
                    self.wifi_socket = conn
                print(f"Connected to ESP32-S3: {addr}")
                conn.settimeout(10.0)
                threading.Thread(target=self.read_esp32_data, args=(conn,), daemon=True).start()
            except Exception as e:
                print(f"Socket error: {e}")
                time.sleep(1)
        server_socket.close()

    def on_coreiot_connect(self, client, userdata, flags, reason_code, props):
        if reason_code == 0:
            print("CoreIOT connected!")
            client.subscribe("v1/devices/me/rpc/request/+")
            client.subscribe("v1/devices/me/attributes")
            client.publish("v1/devices/me/attributes/request", json.dumps({"sharedKeys": DATA_CONFIG["attributes"]["shared"]}))
            print("Subscribed to RPC topic: v1/devices/me/rpc/request/+")
        else:
            print(f"Failed to connect to CoreIOT, reason code: {reason_code}")

    def on_coreiot_message(self, client, userdata, message):
        print(f"Received message from CoreIOT: topic={message.topic}, payload={message.payload.decode('utf-8')}")
        try:
            payload = json.loads(message.payload.decode("utf-8"))
            topic = message.topic
            if topic.startswith("v1/devices/me/rpc/request/"):
                request_id = topic.split('/')[-1]
                method = payload.get('method')
                params = payloads.get('params')
                print(f"RPC call received - method: {method}, params: {params}")
                if method in DATA_CONFIG["rpc_methods"]:
                    self.shared_attributes[f"sharedvalue{method[8:]}"] = params
                    self.forward_command(method, params)
                    client.publish(f"v1/devices/me/rpc/response/{request_id}", json.dumps({"success": True}))
                    print(f"Sent RPC response to CoreIOT: request_id={request_id}")
                else:
                    print(f"Unknown RPC method: {method}")
            elif topic == "v1/devices/me/attributes":
                self.handle_attribute_update(payload)
        except Exception as e:
            print(f"CoreIOT Message Error: {e}")

    def handle_attribute_update(self, payload):
        shared = payload.get('shared', {})
        for key, value in shared.items():
            if key in self.shared_attributes and self.shared_attributes[key] != value:
                self.shared_attributes[key] = value
                method = f"setValue{key[11:]}"
                self.forward_command(method, value)

    def forward_command(self, method, params):
        with self.lock:
            if self.wifi_socket:
                try:
                    payload = f"{method}:{json.dumps({'params': params})}\n"
                    self.wifi_socket.sendall(payload.encode('utf-8'))
                    print(f"Sent RPC command to ESP32-S3: {payload.strip()}")
                except Exception as e:
                    print(f"Error sending RPC command to ESP32-S3: {e}")
                    self.wifi_socket = None
            else:
                print("Cannot send RPC command: No active connection to ESP32-S3")

    def get_rpc_info(self):
        """Lấy thông tin RPC để thêm vào phản hồi (nếu có)."""
        with self.lock:
            for method, param in DATA_CONFIG["rpc_methods"].items():
                attr_key = f"sharedvalue{method[8:]}"
                if attr_key in self.shared_attributes:
                    return {"method": method, "params": self.shared_attributes[attr_key]}
        return None

    def read_esp32_data(self, conn):
        buffer = ""
        while self.running:
            try:
                data = conn.recv(1024).decode('utf-8')
                if not data:
                    print("ESP32-S3 disconnected")
                    break
                buffer += data
                while "\n" in buffer:
                    message, buffer = buffer.split("\n", 1)
                    message = message.strip()
                    if message:
                        print(f"Received from ESP32-S3: {message}")
                        try:
                            msg_type, msg_data = message.split(':', 1)
                            msg_data = json.loads(msg_data)
                            self.data_queue.put((msg_type, msg_data))
                            # Tạo phản hồi với thông tin RPC (nếu có)
                            response = {"status": "success", "message": f"Received {msg_type}"}
                            rpc_info = self.get_rpc_info()
                            if rpc_info:
                                response["rpc"] = rpc_info
                            response_str = json.dumps(response) + "\n"
                            conn.sendall(response_str.encode('utf-8'))
                            print(f"Sent ACK to ESP32-S3: {response_str.strip()}")
                        except Exception as e:
                            print(f"Error parsing message: {e}")
                            error_response = {"status": "error", "message": str(e)}
                            conn.sendall((json.dumps(error_response) + "\n").encode('utf-8'))
            except socket.timeout:
                continue
            except Exception as e:
                print(f"Error reading data: {e}")
                break
        with self.lock:
            if self.wifi_socket == conn:
                self.wifi_socket = None
        conn.close()

    def process_data(self):
        while self.running:
            try:
                msg_type, msg_data = self.data_queue.get(timeout=1)
                if msg_type == "TELEMETRY":
                    self.coreiot_client.publish("v1/devices/me/telemetry", json.dumps(msg_data), qos=1)
                    msg_data["timestamp"] = time.time()
                    inserted_doc = collection.insert_one(msg_data)
                    msg_data["_id"] = inserted_doc.inserted_id
                    print(f"Processed telemetry: {msg_data}")
                elif msg_type == "ATTRIBUTE":
                    self.shared_attributes.update(msg_data)
                    self.coreiot_client.publish("v1/devices/me/attributes", json.dumps({"shared": msg_data}), qos=1)
                elif msg_type == "ATTRIBUTE_REQUEST":
                    keys = msg_data.get("keys", [])
                    response = {"shared": {k: self.shared_attributes[k] for k in keys if k in self.shared_attributes}}
                    rpc_info = self.get_rpc_info()
                    if rpc_info:
                        response["rpc"] = rpc_info
                    with self.lock:
                        if self.wifi_socket:
                            response_str = json.dumps(response) + "\n"
                            print(f"Gửi về ESP32: {response_str}")
                            self.wifi_socket.sendall(response_str.encode('utf-8'))
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Data Processing Error: {e}")

    def start(self):
        self.connect_coreiot()
        threading.Thread(target=self.connect_esp32, daemon=True).start()
        threading.Thread(target=self.process_data, daemon=True).start()
        try:
            while self.running:
                time.sleep(0.1)
        except KeyboardInterrupt:
            self.running = False
        finally:
            with self.lock:
                if self.wifi_socket:
                    self.wifi_socket.close()
            self.coreiot_client.loop_stop()
            self.coreiot_client.disconnect()
            mongo_client.close()

def main():
    gateway = IOTGateway()
    gateway.start()

if __name__ == "__main__":
    main()