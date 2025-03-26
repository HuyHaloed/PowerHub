import network
import socket
import time
from machine import Pin
import dht
import ssd1306
from pins import *
import json

# Define BrokenPipeError and ConnectionResetError for compatibility
try:
    BrokenPipeError
except NameError:
    BrokenPipeError = OSError

try:
    ConnectionResetError
except NameError:
    ConnectionResetError = OSError

# Thông tin WiFi
SSID = "Bonjour"
PASSWORD = "hellosine"

# Địa chỉ IP của IoT Gateway
IOTGATEWAY_IP = "10.0.126.9"  # Thay bằng IP thực tế của IoT Gateway
IOTGATEWAY_PORT = 12345          # Cổng của IoT Gateway

# Khởi tạo biến trạng thái thiết bị
light_state = False
fan_state = False

# Kết nối WiFi
def connect_wifi(max_attempts=20):
    wifi = network.WLAN(network.STA_IF)
    wifi.active(True)
    wifi.connect(SSID, PASSWORD)
    
    attempts = 0
    while not wifi.isconnected() and attempts < max_attempts:
        print(f"Đang kết nối WiFi... ({attempts+1}/{max_attempts})")
        time.sleep(1)
        attempts += 1
    
    if wifi.isconnected():
        print("Kết nối WiFi thành công!")
        print("Địa chỉ IP ESP32-S3:", wifi.ifconfig()[0])
        return wifi
    else:
        print("Lỗi: Không thể kết nối WiFi.")
        return None  # Trả về None để kiểm tra sau

wifi = connect_wifi()

# Khởi tạo màn hình OLED (I2C)
try:
    oled = SSD1306_I2C()
    oled.fill(0)
    oled.text("ESP32-S3 Ready", 0, 0)
    oled.show()
except Exception as e:
    print(f"Lỗi OLED: {e}")

# Khởi tạo cảm biến DHT11
dht_sensor = dht.DHT11(Pin(D3_PIN))

# Khởi tạo các chân điều khiển
light_pin = Pin(D4_PIN, Pin.OUT)  # Giả sử D4 điều khiển đèn
fan_pin = Pin(D13_PIN, Pin.OUT)   # Giả sử D13 điều khiển quạt

# Kết nối đến IoT Gateway qua TCP
def connect_gateway(max_attempts=10, wait_time=3):
    for attempt in range(max_attempts):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            print(f"Đang kết nối đến IoT Gateway... ({attempt+1}/{max_attempts})")
            sock.connect((IOTGATEWAY_IP, IOTGATEWAY_PORT))
            print("Kết nối IoT Gateway thành công!")
            return sock
        except Exception as e:
            print(f"Lỗi kết nối: {e}. Thử lại sau {wait_time} giây...")
            time.sleep(wait_time)
    
    print("Lỗi: Không thể kết nối đến IoT Gateway sau nhiều lần thử.")
    return None

# Hàm xử lý lệnh điều khiển từ IoT Gateway
def process_command(command_data):
    global light_state, fan_state
    
    try:
        # Parse JSON command
        command = json.loads(command_data)
        
        # Kiểm tra loại lệnh
        if 'command_type' in command:
            command_type = command['command_type']
            method = command.get('method', '')
            params = command.get('params', None)
            
            print(f"Nhận lệnh loại: {command_type}, method: {method}, params: {params}")
            
            # Xử lý lệnh dựa trên loại
            if command_type == 'light' or (command_type == 'generic' and method == 'setValueLight'):
                # Lệnh điều khiển đèn
                if params is not None:
                    light_state = bool(params)
                    light_pin.value(1 if light_state else 0)
                    print(f"Đèn đã được {'BẬT' if light_state else 'TẮT'}")
                    update_oled_display()
                    return f"Đèn: {'BẬT' if light_state else 'TẮT'}"
                    
            elif command_type == 'fan' or (command_type == 'generic' and method == 'setValueFan'):
                # Lệnh điều khiển quạt
                if params is not None:
                    fan_state = bool(params)
                    fan_pin.value(1 if fan_state else 0)
                    print(f"Quạt đã được {'BẬT' if fan_state else 'TẮT'}")
                    update_oled_display()
                    return f"Quạt: {'BẬT' if fan_state else 'TẮT'}"
                    
            else:
                # Lệnh không xác định
                print(f"Lệnh không xác định: {command}")
                return "Lệnh không được nhận dạng"
                
        else:
            # Lệnh không có trường command_type
            print(f"Lệnh không có trường command_type: {command}")
            # Thử phân tích dựa vào method
            method = command.get('method', '')
            params = command.get('params', None)
            
            if method == 'setValueLight' and params is not None:
                light_state = bool(params)
                light_pin.value(1 if light_state else 0)
                print(f"Đèn đã được {'BẬT' if light_state else 'TẮT'}")
                update_oled_display()
                return f"Đèn: {'BẬT' if light_state else 'TẮT'}"
                
            elif method == 'setValueFan' and params is not None:
                fan_state = bool(params)
                fan_pin.value(1 if fan_state else 0)
                print(f"Quạt đã được {'BẬT' if fan_state else 'TẮT'}")
                update_oled_display()
                return f"Quạt: {'BẬT' if fan_state else 'TẮT'}"
            
            return "Lệnh không được nhận dạng"
            
    except Exception as e:
        print(f"Lỗi xử lý lệnh: {e}")
        return f"Lỗi: {e}"

# Cập nhật màn hình OLED
def update_oled_display(temp=None, humid=None, counter=None):
    try:
        oled.fill(0)
        oled.text("YoloUno Status:", 0, 0)
        
        # Hiển thị trạng thái thiết bị
        oled.text(f"Light: {'ON' if light_state else 'OFF'}", 0, 10)
        oled.text(f"Fan: {'ON' if fan_state else 'OFF'}", 0, 20)
        
        # Hiển thị nhiệt độ và độ ẩm nếu có
        if temp is not None and humid is not None:
            oled.text(f"Temp: {temp}C", 0, 30)
            oled.text(f"Humid: {humid}%", 0, 40)
        
        # Hiển thị bộ đếm nếu có
        if counter is not None:
            oled.text(f"Count: {counter}", 0, 50)
            
        oled.show()
    except Exception as e:
        print(f"Lỗi cập nhật OLED: {e}")

sock = connect_gateway()
counter = 0  # Biến đếm số lần gửi dữ liệu

try:
    while True:
        try:
            if not wifi.isconnected():
                print("Mất kết nối tới WiFi! Đang thử kết nối lại...")
                wifi = connect_wifi()
                if wifi is None:
                    continue 
            if sock is None:
                print("Không có kết nối với IoT Gateway, đang thử kết nối lại...")
                sock = connect_gateway()
                if sock is None:
                    time.sleep(5)
                    continue
                    
            # Kiểm tra dữ liệu nhận được từ IoT Gateway
            sock.settimeout(0.1)  # Non-blocking check
            try:
                data = sock.recv(1024).decode().strip()
                if data:
                    print("Dữ liệu từ Gateway:", data)
                    # Xử lý lệnh điều khiển nếu có
                    response = process_command(data)
                    # Gửi phản hồi về Gateway
                    sock.send(f"YoloUno đã nhận và xử lý: {response}".encode())
            except socket.timeout:
                # Không có dữ liệu nhận - điều này bình thường
                pass
            except Exception as e:
                print(f"Lỗi khi nhận dữ liệu: {e}")
                
            # Đọc dữ liệu cảm biến và gửi đi sau mỗi khoảng thời gian
            if counter % 5 == 0:  # Gửi dữ liệu mỗi 5 lần lặp
                try:
                    # Đọc dữ liệu cảm biến
                    dht_sensor.measure()
                    temperature = dht_sensor.temperature()
                    humidity = dht_sensor.humidity()
                    
                    # Chuẩn bị dữ liệu để gửi
                    data = {
                        "counter": counter,
                        "temperature": temperature,
                        "humidity": humidity,
                        "light": light_state,
                        "fan": fan_state
                    }
                    json_data = json.dumps(data)
                    print("Gửi dữ liệu:", json_data)
                    sock.send(json_data.encode())
                    
                    # Cập nhật màn hình OLED
                    update_oled_display(temperature, humidity, counter)
                    
                    # Đợi phản hồi từ Gateway
                    sock.settimeout(2)
                    try:
                        response = sock.recv(1024).decode().strip()
                        print("Phản hồi từ Gateway:", response)
                    except socket.timeout:
                        print("Không nhận được phản hồi từ Gateway.")
                        
                except Exception as e:
                    print(f"Lỗi gửi dữ liệu cảm biến: {e}")
            
            counter += 1
            time.sleep(1)  # Delay 1 giây mỗi lần lặp
                
        except (OSError, BrokenPipeError, ConnectionResetError) as e:
            print(f"Lỗi kết nối: {e}, đóng kết nối và thử lại...")
            if sock:
                sock.close()
            sock = None
            time.sleep(2) 
                
except KeyboardInterrupt:
    print("\nNgắt kết nối từ bàn phím.")

finally:
    print("Đóng kết nối.")
    if sock:
        sock.close()