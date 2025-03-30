import time
import json
import serial
import threading

class SensorHandler:
    def __init__(self, serial_port="/dev/ttyUSB0", baud_rate=115200):
        """
        Khởi tạo trình xử lý cảm biến
        
        :param serial_port: Cổng serial kết nối các cảm biến
        :param baud_rate: Tốc độ truyền dữ liệu
        """
        self.serial_port = serial_port
        self.baud_rate = baud_rate
        self.connection = None
        self.sensor_data = {
            'temperature': None,
            'humidity': None,
            'light_intensity': None,
            'power_consumption': None
        }
        self.is_running = False
        self.lock = threading.Lock()

    def connect(self):
        """Kết nối với cổng serial"""
        try:
            self.connection = serial.Serial(self.serial_port, self.baud_rate, timeout=1)
            print(f"Kết nối thành công với cổng {self.serial_port}")
            return True
        except serial.SerialException as e:
            print(f"Lỗi kết nối serial: {e}")
            return False

    def _read_sensor_data(self):
        """Đọc dữ liệu từ các cảm biến"""
        while self.is_running:
            try:
                if self.connection and self.connection.in_waiting > 0:
                    raw_data = self.connection.readline().decode().strip()
                    processed_data = self._parse_sensor_data(raw_data)
                    
                    if processed_data:
                        with self.lock:
                            self.sensor_data.update(processed_data)
            except Exception as e:
                print(f"Lỗi đọc dữ liệu cảm biến: {e}")
            
            time.sleep(0.1)

    def _parse_sensor_data(self, raw_data):
        """
        Phân tích dữ liệu thô từ cảm biến
        
        :param raw_data: Chuỗi dữ liệu thô
        :return: Từ điển dữ liệu đã được xử lý
        """
        try:
            # Giả sử dữ liệu được gửi dưới dạng JSON
            sensor_dict = json.loads(raw_data)
            
            # Ánh xạ dữ liệu từ cảm biến DHT22
            if 'temperature' in sensor_dict and 'humidity' in sensor_dict:
                return {
                    'temperature': sensor_dict['temperature'],
                    'humidity': sensor_dict['humidity']
                }
            
            # Ánh xạ dữ liệu từ cảm biến ánh sáng
            if 'light_intensity' in sensor_dict:
                return {
                    'light_intensity': sensor_dict['light_intensity']
                }
            
            # Ánh xạ dữ liệu từ module đo điện năng
            if 'power_consumption' in sensor_dict:
                return {
                    'power_consumption': sensor_dict['power_consumption']
                }
            
            return None
        except json.JSONDecodeError:
            print(f"Không thể giải mã dữ liệu: {raw_data}")
            return None
        except Exception as e:
            print(f"Lỗi xử lý dữ liệu cảm biến: {e}")
            return None

    def start_reading(self):
        """Bắt đầu đọc dữ liệu từ các cảm biến"""
        if not self.connection:
            if not self.connect():
                return False
        
        self.is_running = True
        reading_thread = threading.Thread(target=self._read_sensor_data, daemon=True)
        reading_thread.start()
        return True

    def stop_reading(self):
        """Dừng đọc dữ liệu từ các cảm biến"""
        self.is_running = False
        if self.connection:
            self.connection.close()

    def get_latest_sensor_data(self):
        """
        Lấy dữ liệu cảm biến mới nhất
        
        :return: Từ điển chứa dữ liệu các cảm biến
        """
        with self.lock:
            return self.sensor_data.copy()

    def calibrate_sensors(self):
        """
        Hiệu chỉnh các cảm biến
        Phương thức này cần được điều chỉnh theo từng loại cảm biến cụ thể
        """
        try:
            # Gửi lệnh hiệu chỉnh qua serial
            if self.connection:
                calibration_cmd = json.dumps({"command": "calibrate"})
                self.connection.write(calibration_cmd.encode())
                print("Đã gửi lệnh hiệu chỉnh cho các cảm biến")
        except Exception as e:
            print(f"Lỗi hiệu chỉnh cảm biến: {e}")

def main():
    # Ví dụ sử dụng
    sensor_handler = SensorHandler(serial_port="COM12")  # Điều chỉnh cổng COM phù hợp
    
    if sensor_handler.start_reading():
        try:
            while True:
                # Lấy và in dữ liệu cảm biến mỗi 5 giây
                latest_data = sensor_handler.get_latest_sensor_data()
                print("Dữ liệu cảm biến mới nhất:", latest_data)
                time.sleep(5)
        except KeyboardInterrupt:
            print("\nDừng đọc dữ liệu")
        finally:
            sensor_handler.stop_reading()

if __name__ == "__main__":
    main()