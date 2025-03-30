import serial
import serial.tools.list_ports
import paho.mqtt.client as mqttclient
import json
import time
import threading

class DataProcessingManager:
    """
    Trung tâm quản lý xử lý dữ liệu cho dự án Power Hub
    """
    def __init__(self, 
                 broker="app.coreiot.io", 
                 port=1883, 
                 access_token="rsoMvGsRuM9iNbDZBZd3"):
        """
        Khởi tạo quản lý xử lý dữ liệu
        
        :param broker: Địa chỉ MQTT broker
        :param port: Cổng kết nối MQTT
        :param access_token: Token truy cập CoreIOT
        """
        # Cấu hình kết nối CoreIOT
        self.broker = broker
        self.port = port
        self.access_token = access_token
        
        # Cấu hình kết nối serial
        self.baud_rate = 115200
        self.potential_ports = ["COM12", "COM3", "COM4", "COM5"]
        
        # Quản lý kết nối
        self.mqtt_client = None
        self.serial_connection = None
        self.serial_port = None
        
        # Lưu trữ dữ liệu
        self.sensor_data = {
            'temperature': None,
            'humidity': None,
            'light_intensity': None
        }
        
        # Cờ trạng thái
        self.is_mqtt_connected = False
        self.is_serial_connected = False

    def connect_mqtt(self):
        """Kết nối đến MQTT Broker"""
        try:
            self.mqtt_client = mqttclient.Client("DATA_PROCESSING")
            self.mqtt_client.username_pw_set(self.access_token)
            
            def on_connect(client, userdata, flags, rc):
                if rc == 0:
                    print("Kết nối MQTT thành công!")
                    self.is_mqtt_connected = True
                    # Đăng ký các topic cần thiết
                    client.subscribe("v1/devices/me/rpc/request/+")
                else:
                    print(f"Kết nối MQTT thất bại. Mã lỗi: {rc}")
            
            def on_message(client, userdata, message):
                """Xử lý tin nhắn nhận được"""
                try:
                    payload = json.loads(message.payload.decode("utf-8"))
                    print(f"Nhận dữ liệu: {payload}")
                    
                    # Xử lý lệnh điều khiển
                    if 'method' in payload:
                        self._process_command(payload)
                except Exception as e:
                    print(f"Lỗi xử lý tin nhắn: {e}")
            
            self.mqtt_client.on_connect = on_connect
            self.mqtt_client.on_message = on_message
            
            self.mqtt_client.connect(self.broker, self.port)
            self.mqtt_client.loop_start()
        except Exception as e:
            print(f"Lỗi kết nối MQTT: {e}")

    def find_serial_port(self):
        """Tìm cổng serial cho thiết bị"""
        # Thử các cổng đã biết trước
        for port in self.potential_ports:
            try:
                ser = serial.Serial(port, self.baud_rate, timeout=1)
                print(f"Kết nối thành công với cổng {port}")
                return ser, port
            except (serial.SerialException, FileNotFoundError):
                continue
        
        # Quét tất cả các cổng có sẵn
        ports = list(serial.tools.list_ports.comports())
        for port in ports:
            try:
                ser = serial.Serial(port.device, self.baud_rate, timeout=1)
                print(f"Kết nối thành công với cổng {port.device}")
                return ser, port.device
            except (serial.SerialException, FileNotFoundError):
                continue
        
        print("Không tìm thấy cổng kết nối")
        return None, None

    def connect_serial(self):
        """Kết nối với cổng serial"""
        self.serial_connection, self.serial_port = self.find_serial_port()
        
        if self.serial_connection:
            self.is_serial_connected = True
            return True
        return False

    def _process_command(self, command):
        """
        Xử lý các lệnh điều khiển từ MQTT
        
        :param command: Lệnh nhận được
        """
        try:
            if command.get('method') == 'setValue':
                # Gửi lệnh đến thiết bị qua serial nếu được kết nối
                if self.serial_connection and self.serial_connection.is_open:
                    self.serial_connection.write(json.dumps(command).encode('utf-8'))
                    print(f"Đã gửi lệnh: {command}")
        except Exception as e:
            print(f"Lỗi xử lý lệnh: {e}")

    def read_sensor_data(self):
        """Đọc dữ liệu từ cảm biến"""
        while self.is_serial_connected:
            try:
                if self.serial_connection and self.serial_connection.in_waiting > 0:
                    data = self.serial_connection.readline().decode().strip()
                    processed_data = self._parse_sensor_data(data)
                    
                    if processed_data:
                        # Cập nhật dữ liệu cảm biến
                        self.sensor_data.update(processed_data)
                        
                        # Gửi dữ liệu lên MQTT nếu đã kết nối
                        if self.is_mqtt_connected:
                            self.mqtt_client.publish(
                                'v1/devices/me/telemetry', 
                                json.dumps(processed_data), 
                                qos=1
                            )
            except Exception as e:
                print(f"Lỗi đọc dữ liệu: {e}")
            
            time.sleep(0.1)

    def _parse_sensor_data(self, raw_data):
        """
        Phân tích dữ liệu thô từ cảm biến
        
        :param raw_data: Dữ liệu thô từ cảm biến
        :return: Dữ liệu đã được xử lý
        """
        try:
            # Giả định dữ liệu ở định dạng JSON
            sensor_dict = json.loads(raw_data)
            
            # Trích xuất và xử lý dữ liệu
            processed_data = {}
            if 'temperature' in sensor_dict:
                processed_data['temperature'] = sensor_dict['temperature']
            if 'humidity' in sensor_dict:
                processed_data['humidity'] = sensor_dict['humidity']
            if 'light' in sensor_dict:
                processed_data['light_intensity'] = sensor_dict['light']
            
            return processed_data
        except json.JSONDecodeError:
            print(f"Không thể giải mã dữ liệu: {raw_data}")
            return None
        except Exception as e:
            print(f"Lỗi xử lý dữ liệu: {e}")
            return None

    def run_data_prediction(self):
        """
        Chạy dự đoán dữ liệu
        Placeholder cho mô hình AI thực tế
        """
        while True:
            try:
                if self.sensor_data:
                    prediction = self._simple_prediction(self.sensor_data)
                    print(f"Dự đoán: {prediction}")
                    
                    # Gửi dự đoán lên MQTT
                    if self.is_mqtt_connected:
                        self.mqtt_client.publish(
                            'v1/devices/me/attributes', 
                            json.dumps({'prediction': prediction}), 
                            qos=1
                        )
            except Exception as e:
                print(f"Lỗi dự đoán: {e}")
            
            time.sleep(5)

    def _simple_prediction(self, data):
        """
        Dự đoán đơn giản dựa trên dữ liệu
        
        :param data: Dữ liệu cảm biến
        :return: Kết quả dự đoán
        """
        if 'temperature' in data:
            return 'Nhiệt độ cao' if data['temperature'] > 50 else 'Nhiệt độ bình thường'
        return 'Không có dự đoán'

    def start(self):
        """Khởi động quản lý xử lý dữ liệu"""
        # Kết nối MQTT
        self.connect_mqtt()
        
        # Kết nối Serial
        if not self.connect_serial():
            print("Không thể kết nối serial")
            return
        
        # Tạo các luồng xử lý
        threads = [
            threading.Thread(target=self.read_sensor_data, daemon=True),
            threading.Thread(target=self.run_data_prediction, daemon=True)
        ]
        
        # Khởi chạy các luồng
        for thread in threads:
            thread.start()
        
        # Giữ chương trình chạy
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nDừng xử lý dữ liệu")
        finally:
            # Đóng kết nối
            if self.serial_connection:
                self.serial_connection.close()
            if self.mqtt_client:
                self.mqtt_client.disconnect()

def main():
    """Hàm chính để chạy quản lý xử lý dữ liệu"""
    data_manager = DataProcessingManager()
    data_manager.start()

if __name__ == "__main__":
    main()