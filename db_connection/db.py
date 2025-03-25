#import library
import serial
import paho.mqtt.client as mqtt
import json
import time
import threading
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
HOST = '' # Listen to every IP address
PORT = '12345' # port from ESP32-S3

# the connection to the db
MONGO_URI = "mongodb+srv://tanbanquyen:Fqvqx1311@cluster0.joez7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client["iot-device"]
collection = db["time-device-working"]

print("Connect to MongoDB successfull!")

# insert test data into the db
# test_data = {"device" : "YoloUno", "temperature" : 25.5}
# collection.insert_one(test_data)
# print("The data have been insert to the database successfull!")

# function to access data from coreiot
def on_message_db(client, userdata, msg):
    data = json.loads(msg.payload)
    collection.insert_one(data)
    print("Data have been saved successfull to MongoDB: ", data)

    mqtt_client = mqtt.Client()
    mqtt_client.connect("mqtt.coreiot.io", 1883, 60)
    mqtt_client.subscribe("coreiot/yolouno/data")
    mqtt_client.on_message = on_message
    mqtt_client.loop_forever()
    
    latest_data = collection.find_one(sort=[("_id", -1)])
    print("latest data:", latest_data)

# Define BrokenPipeError for Python 2 compatibility
try:
    BrokenPipeError
except NameError:
    BrokenPipeError = IOError

class db_connection:
    def __init__(self, connection_type = 'wifi'):
        #CoreIOT MQTT Client Setup
        self.coreiot_client = mqtt.Client(
            client_id = "IOT_GATEWAY",
            clean_session = True
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2
        )
        self.coreiot_client.username_pw_set(COREIOT_ACCESS_TOKEN)
        self.coreiot_client.on_connect = self.on_coreiot_connect
        self.coreiot_client.message = self.on_coreiot_message
        
        # connection setup
        self.connection_type = connection_type
        self.serial_connection = None
        self.serial_port = None
        #connection_type = serial if it's serial port. Otherwise,  connection_type = wifi: IP address of ESP32-S3
        self.wifi_socket = None
        self.connection_queue = queue.Queue()
        self.data_queue = queue.Queue() # to save the data from YoloUno
        
        #flag and data storage
        self.is_connected = False
        self.latest_sensor_data = {}
        
    def find_yolouno_port(self):
        if self.connection_type == 'serial':
            for port in POTENTIAL_PORTS:
                try:
                    seri = serial.Serial(port, BAUD_RAT, timeout = 1)
                    print(f"Connect successful with port: {port}")
                    return seri, port
                except (serial.SerialException, FileNotFoundError):
                    continue
            port = list(serial.tools.list_ports.comports())
            for port in ports:
                try:
                    seri = serial.Serial(port.device, BAUD_RATE, timeout = 1)
                    print(f"Connect successful with port: {port.device}")
                    return seri, port.device
                except (serial.SerialException, FileNotFoundError):
                    continue
            print("Can't find any port to connect with YoloUno!")
            return None, None
        elif self.connection_type == 'wifi':
            try:
                if self.wifi_socket == None:
                    server.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                    server_socket.bind((HOST, PORT))
                    server_socket.listen(1)
                print("IoT Gateway is waiting to connect... (Enter Ctrl+C to stop)")
                while True:
                    try: 
                        conn, addr = server_socket.accept()
                        print(f"Connection from ESP32-S3: {addr}")
                        conn.settimeout(1.5)
                        self.connection_queue.put((conn, addr))
                        break
                    except Exception as e: 
                        print(f"Wifi Connection error: {e}")
                        self.connection_queue.put((None, None))
    
    def connect_coreiot(self):
        try:
            self.coreiot_client.connect(COREIOT_BROKER, COREIOT_PORT)
            self.coreiot_client.loop_start()
        except Exception as e:
            print(f"CoreIoT connection error: {e}")
            
    def connect_yolouno(self):
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
        if rc == 0:
            print("Connected to CoreIOT successfully!")
            client.subscribe("v1/devices/me/rpc/request/+")
            self.is_connected = True
        else:
            print("CoreIOT Connection Failed")
            
    def on_coreiot_message(self, client, userdata, message):
         try:
            payload = json.loads(message.payload.decode("utf-8"))
            print(f"Received from CoreIOT: {payload}")
            if 'method' in payload:
                if payload['method'] == 'setValue':
                    self.forward_command_to_yolouno(payload)
        except Exception as e:
            print(f"CoreIOT Message Processing Error: {e}")
        
    def forward_command_to_yolouno(self, command):
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
    
    #read the data from yolouno to update to MongoDB            
    def read_yolouno_data(self):
        count_timeout = 0
        while True:
            try:
                if self.connection_type == 'wifi' and self.wifi_socket:
                    try:
                        data = self.wifi_socket.recv(1024).decode().strip()
                        if data:
                            print(f"Data from ESP32-S3: {data}")
                            self.data_queue.put(data)
                            # Gửi xác nhận ngay sau khi nhận dữ liệu từ bên kia
                            response = f"Gateway has been save data: {data}"
                            self.wifi_socket.sendall(response.encode())
                            count_timeout = 0
                        else:
                            raise ConnectionResetError("ESP32-S3 has closed port")
                    except socket.timeout:
                        count_timeout += 1
                        print(f"Timeout when take data from ESP32-S3 [{count_timeout}]")
                        if count_timeout >= 10: # khúc này chat ko hiểu nó làm dị chi
                            count_timeout = 0
                            self.wifi_socket.close()
                            self.wifi_socket = None
                            print("ESP32-S3 doesn't respond, close connection.")
                            raise ConnectionResetError("ESP32-S3 does not respond")
                elif self.connection_type == 'wifi' and not self.wifi_socket:
                    print("Connection wiith ESP32-S3 has been closed.")
                    if self.connect_yolouno():
                        print("Reconnect successfully.")
                        count_timeout = 0
                    else:
                        time.sleep(2)  
            except Exception as e:
                print(f"Error reading data from YoloUno: {e}")
                if self.wifi_socket:
                    self.wifi_socket.close()
                self.wifi_socket = None
                time.sleep(2)
                
    def process_yolouno_data(self):
        while True:
            try:
                data = self.data_queue.get()
                sensor_data = self.parse_sensor_data(data)
                if sensor_data:
                    self.latest_sensor_data.update(sensor_data)
                    self.coreiot_client.publish(
                        'v1/devices/me/telemetry',
                        json.dumps(sensor_data),
                        qos=1
                    )
            except Exception as e:
                print(f"Data Processing Error: {e}")
            time.sleep(0.1)
    
    def parse_sensor_data(self, data):
        """
        Parse incoming data from YoloUno.
        Modify this method based on the actual data format from your YoloUno device.
        """
        try:
            parsed_data = json.loads(data)
            return parsed_data
        except json.JSONDecodeError:
            print(f"Can not analysis data: {data}")
            return None

    def start(self):
        """Start the IOT Gateway"""
        self.connect_coreiot()
        if not self.connect_yolouno():
            print("Không thể kết nối với YoloUno. Đang thoát.")
            return
        threads = [
            threading.Thread(target=self.read_yolouno_data, daemon=True),
            threading.Thread(target=self.process_yolouno_data, daemon=True)
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

def main():
    # Change connection_type to 'wifi' for WiFi connection
    gateway = db_connection(connection_type='wifi')
    gateway.start()

if __name__ == "__main__":
    main()