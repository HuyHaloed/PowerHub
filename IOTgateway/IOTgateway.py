import serial
import serial.tools.list_ports
import paho.mqtt.client as mqttclient
import json
import time
import threading

# CoreIOT Configuration
COREIOT_BROKER = "app.coreiot.io"
COREIOT_PORT = 1883
COREIOT_ACCESS_TOKEN = "rsoMvGsRuM9iNbDZBZd3"
COREIOT_ACCESS_USERNAME = "IOT_DEVICE_3"

# YoloUno Serial Configuration
BAUD_RATE = 115200
POTENTIAL_PORTS = ["COM12", "COM3", "COM4", "COM5"] 

class IOTGateway:
    def __init__(self):
        # CoreIOT MQTT Client Setup
        self.coreiot_client = mqttclient.Client(
            client_id="IOT_GATEWAY", 
            clean_session=True,
            callback_api_version=mqttclient.CallbackAPIVersion.VERSION2
        )
        self.coreiot_client.username_pw_set(COREIOT_ACCESS_TOKEN)
        self.coreiot_client.on_connect = self.on_coreiot_connect
        self.coreiot_client.on_message = self.on_coreiot_message

        # YoloUno Serial Setup
        self.serial_connection = None
        self.serial_port = None
        
        # Flags and data storage
        self.is_connected = False
        self.latest_sensor_data = {}

    def find_yolouno_port(self):
        """Tìm cổng Serial cho YoloUno"""
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

    def connect_coreiot(self):
        """Establish connection to CoreIOT MQTT Broker"""
        try:
            self.coreiot_client.connect(COREIOT_BROKER, COREIOT_PORT)
            self.coreiot_client.loop_start()
        except Exception as e:
            print(f"CoreIOT Connection Error: {e}")

    def connect_yolouno(self):
        """Establish serial connection with YoloUno"""
        try:
            self.serial_connection, self.serial_port = self.find_yolouno_port()
            if self.serial_connection:
                print(f"Connected to YoloUno on {self.serial_port}")
                return True
            return False
        except Exception as e:
            print(f"YoloUno Serial Connection Error: {e}")
            return False

    def on_coreiot_connect(self, client, userdata, flags, rc):
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
        if self.serial_connection and self.serial_connection.is_open:
            try:
                self.serial_connection.write(json.dumps(command).encode('utf-8'))
                print(f"Forwarded command to YoloUno: {command}")
            except Exception as e:
                print(f"Error forwarding command: {e}")

    def read_yolouno_data(self):
        """Continuously read data from YoloUno and process"""
        while True:
            try:
                if self.serial_connection and self.serial_connection.in_waiting > 0:
                    data = self.serial_connection.readline().decode().strip()
                    if data:
                        print(f"Data from YoloUno: {data}")
                        self.process_yolouno_data(data)
            except Exception as e:
                print(f"YoloUno Data Reading Error: {e}")
            time.sleep(0.1)

    def process_yolouno_data(self, data):
        """Process and forward data to CoreIOT"""
        try:
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

    def parse_sensor_data(self, data):
        """
        Parse incoming data from YoloUno.
        Modify this method based on the actual data format from your YoloUno device.
        """
        try:
            parsed_data = json.loads(data)
            return parsed_data
        except:

            print(f"Không thể phân tích dữ liệu: {data}")
            return None

    def run_ai_prediction(self):
        """
        Run AI model for predictions.
        Placeholder for actual AI model implementation.
        """
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
        """
        Placeholder for simple AI prediction.
        Replace with actual machine learning model.
        """
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
            self.coreiot_client.disconnect()

def main():
    gateway = IOTGateway()
    gateway.start()

if __name__ == "__main__":
    main()