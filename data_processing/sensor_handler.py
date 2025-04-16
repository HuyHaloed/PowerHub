# PowerHub/data_processing/sensor_handler.py
import time
import json
import serial
import threading

class SensorHandler:
    def __init__(self, serial_port="/dev/ttyUSB0", baud_rate=115200):
        """
        Khởi tạo trình xử lý cảm biến

        :param serial_port: Cổng serial kết nối các cảm biến (YoloUno)
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
        self.read_thread = None # To hold the thread object
        self.lock = threading.Lock()

    def connect(self):
        """Kết nối với cổng serial"""
        if self.connection and self.connection.is_open:
             print(f"Đã kết nối trên cổng {self.serial_port}")
             return True
        try:
            self.connection = serial.Serial(self.serial_port, self.baud_rate, timeout=1)
            print(f"Kết nối thành công với cổng {self.serial_port}")
            return True
        except serial.SerialException as e:
            print(f"Lỗi kết nối serial: {e}")
            self.connection = None # Ensure connection is None on failure
            return False
        except Exception as e: # Catch other potential errors like file not found
             print(f"Lỗi không xác định khi kết nối serial: {e}")
             self.connection = None
             return False


    def _read_sensor_data(self):
        """Đọc dữ liệu từ các cảm biến (chạy trong luồng riêng)"""
        print("[SensorHandler] Luồng đọc bắt đầu.")
        while self.is_running:
            if not self.connection or not self.connection.is_open:
                print("[SensorHandler] Mất kết nối serial. Đang thử kết nối lại...")
                if not self.connect():
                    print("[SensorHandler] Kết nối lại thất bại. Tạm dừng 5 giây.")
                    time.sleep(5)
                    continue # Try again in the next loop iteration
                else:
                    print("[SensorHandler] Đã kết nối lại thành công.")

            try:
                if self.connection.in_waiting > 0:
                    raw_data = self.connection.readline().decode().strip()
                    if raw_data: # Process only if data is not empty
                         # print(f"[SensorHandler] Raw data received: {raw_data}") # Optional debug print
                         processed_data = self._parse_sensor_data(raw_data)

                         if processed_data:
                             with self.lock:
                                 self.sensor_data.update(processed_data)
                                 # print(f"[SensorHandler] Updated data: {self.sensor_data}") # Optional debug print
            except serial.SerialException as se:
                 print(f"[SensorHandler] Lỗi serial khi đọc: {se}. Đang thử kết nối lại.")
                 if self.connection:
                      self.connection.close()
                 self.connection = None
                 time.sleep(2) # Wait before attempting reconnect in the next loop
            except Exception as e:
                # Catch other potential errors during reading/parsing
                print(f"[SensorHandler] Lỗi không xác định trong luồng đọc: {e}")
                # Decide if you need to reconnect or just wait
                time.sleep(1) # Prevent rapid looping on persistent errors

            time.sleep(0.1) # Short pause to prevent high CPU usage
        print("[SensorHandler] Luồng đọc đã dừng.")


    def _parse_sensor_data(self, raw_data):
        """
        Phân tích dữ liệu thô từ cảm biến

        :param raw_data: Chuỗi dữ liệu thô
        :return: Từ điển dữ liệu đã được xử lý hoặc None
        """
        try:
            # Giả sử dữ liệu được gửi dưới dạng JSON
            sensor_dict = json.loads(raw_data)
            valid_data = {}

            # Check for known keys and add them if present
            keys_to_check = ['temperature', 'humidity', 'light_intensity', 'power_consumption']
            for key in keys_to_check:
                if key in sensor_dict:
                    valid_data[key] = sensor_dict[key]

            return valid_data if valid_data else None # Return data only if we found keys we know

        except json.JSONDecodeError:
            # Ignore lines that are not valid JSON
            # print(f"[SensorHandler] Không thể giải mã JSON: {raw_data}") # Optional debug print
            return None
        except Exception as e:
            print(f"[SensorHandler] Lỗi xử lý dữ liệu cảm biến: {e}")
            return None

    def send_command(self, command_payload: dict):
        """
        Sends a command payload (dictionary) as JSON over the serial connection.

        :param command_payload: Dictionary representing the command.
        :return: True if sending was attempted successfully, False otherwise.
        """
        if self.connection and self.connection.is_open:
            try:
                # Convert dict to JSON string, encode to bytes, add newline
                command_json = json.dumps(command_payload) + '\n'
                self.connection.write(command_json.encode('utf-8'))
                # print(f"[SensorHandler] Sent command: {command_payload}") # Optional debug print
                return True
            except serial.SerialException as se:
                 print(f"[SensorHandler] Lỗi serial khi gửi lệnh: {se}. Có thể cần kết nối lại.")
                 if self.connection:
                     self.connection.close()
                 self.connection = None
                 return False
            except Exception as e:
                print(f"[SensorHandler] Lỗi không xác định khi gửi lệnh: {e}")
                return False
        else:
            print("[SensorHandler] Không thể gửi lệnh: Kết nối serial không khả dụng.")
            return False

    def start_reading(self):
        """Bắt đầu đọc dữ liệu từ các cảm biến trong một luồng riêng"""
        if self.is_running:
             print("[SensorHandler] Đã chạy rồi.")
             return True

        if not self.connection:
            if not self.connect():
                print("[SensorHandler] Không thể bắt đầu đọc do lỗi kết nối.")
                return False

        self.is_running = True
        # Create and start the thread
        self.read_thread = threading.Thread(target=self._read_sensor_data, daemon=True, name="SensorReadThread")
        self.read_thread.start()
        print("[SensorHandler] Đã bắt đầu luồng đọc.")
        return True

    def stop_reading(self):
        """Dừng đọc dữ liệu từ các cảm biến"""
        if not self.is_running:
             return

        print("[SensorHandler] Đang dừng luồng đọc...")
        self.is_running = False

        # Wait briefly for the thread to exit gracefully
        if self.read_thread and self.read_thread.is_alive():
             self.read_thread.join(timeout=1.0) # Wait up to 1 second

        if self.connection and self.connection.is_open:
            try:
                 self.connection.close()
                 print("[SensorHandler] Đã đóng kết nối serial.")
            except Exception as e:
                 print(f"[SensorHandler] Lỗi khi đóng kết nối serial: {e}")
        self.connection = None


    def get_latest_sensor_data(self):
        """
        Lấy dữ liệu cảm biến mới nhất (thread-safe)

        :return: Bản sao của từ điển chứa dữ liệu các cảm biến
        """
        with self.lock:
            return self.sensor_data.copy()

    def calibrate_sensors(self):
        """
        Gửi lệnh hiệu chỉnh (placeholder)
        """
        print("[SensorHandler] Gửi lệnh hiệu chỉnh (nếu được thiết bị hỗ trợ)...")
        calibration_cmd = {"command": "calibrate"}
        success = self.send_command(calibration_cmd)
        if not success:
             print("[SensorHandler] Gửi lệnh hiệu chỉnh thất bại.")

# --- Example usage / test block ---
def main():
    print("Kiểm tra SensorHandler...")
    # Điều chỉnh cổng COM phù hợp với máy của bạn
    sensor_handler = SensorHandler(serial_port="COM12") # Hoặc /dev/ttyUSB0 trên Linux/Mac

    if sensor_handler.start_reading():
        try:
            count = 0
            while count < 5: # Chạy trong ~25 giây để kiểm tra
                # Lấy và in dữ liệu cảm biến mỗi 5 giây
                latest_data = sensor_handler.get_latest_sensor_data()
                print(f"Dữ liệu mới nhất ({time.strftime('%H:%M:%S')}): {latest_data}")

                # Gửi lệnh test mỗi 10 giây (2 lần)
                if count % 2 == 0:
                     cmd = {"method": "setValue", "params": {"test": count}}
                     sensor_handler.send_command(cmd)

                time.sleep(5)
                count += 1
        except KeyboardInterrupt:
            print("\nDừng đọc dữ liệu thủ công")
        finally:
            sensor_handler.stop_reading()
    else:
        print("Không thể bắt đầu SensorHandler.")

if __name__ == "__main__":
    main()