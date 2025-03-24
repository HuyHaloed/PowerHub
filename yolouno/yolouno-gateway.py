#################### Gửi nhận data với IOTgateway ver 1 ####################
# import network
# import socket
# import time
# import ssd1306

# # Cấu hình WiFi
# SSID = "Bonjour"
# PASSWORD = "hellosine"

# # Kết nối WiFi
# wifi = network.WLAN(network.STA_IF)
# wifi.active(True)
# wifi.connect(SSID, PASSWORD)

# while not wifi.isconnected():
#     print("Đang kết nối WiFi...")
#     time.sleep(1)

# print("Kết nối WiFi thành công!")
# print("Địa chỉ IP ESP32-S3:", wifi.ifconfig()[0])

# # Cấu hình màn hình OLED (I2C)
# try:
#   oled = SSD1306_I2C()
#   oled.fill(0)
#   oled.text("ESP32 Server", 0, 0)
#   oled.text("IP:", 0, 10)
#   oled.text(f"{wifi.ifconfig()[0]}", 0, 20)
#   oled.show()
# except Exception as e:
#     print(f"Lỗi OLED: {e}")

# # Cấu hình TCP Server
# server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# # Cho phép tái sử dụng cổng nếu bị chiếm dụng
# server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

# server_socket.bind(('', 12345))  # Lắng nghe trên cổng 12345
# server_socket.listen(1)
# print("Chờ kết nối từ IoT Gateway...")

# try:
#   conn, addr = server_socket.accept()
#   print(f"Kết nối từ: {addr}")
  
#   counter = 0  # Biến đếm

#   while True:
#       # Nhận dữ liệu từ IoT Gateway
#       data = conn.recv(1024).decode().strip()
#       if data:
#           print("Nhận từ Gateway:", data)
  
#           # Hiển thị dữ liệu trên OLED
#           oled.fill(0)
#           oled.text("Data from GW:", 0, 0)
#           oled.text(data, 0, 10)
#           oled.show()
  
#           # Gửi phản hồi lại IoT Gateway
#           conn.send("ESP32 đã nhận: ".encode() + data.encode())
  
#       # Gửi biến đếm mỗi giây
#       counter += 1
#       counter_msg = f"Counter: {counter}"
#       print("Gửi đến Gateway:", counter_msg)
#       conn.send(counter_msg.encode())
      
#       # Hiển thị lên OLED
#       oled.fill(0)
#       oled.text("ESP32 Counter", 0, 0)
#       oled.text(str(counter), 0, 10)
#       oled.show()
  
#       time.sleep(1)  # Chờ 1 giây trước khi gửi tiếp


# except KeyboardInterrupt:
#     print("\nNgắt kết nối từ bàn phím.")

# except Exception as e:
#     print(f"Lỗi chung: {e}")

# finally:
#     print("Đóng kết nối.")
#     server_socket.close()

#################### Gửi nhận data với IOTgateway ver 2 ####################
import network
import socket
import time
from machine import Pin
import dht
import ssd1306
from pins import *
import json  # Thêm import json

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
                print("Không có kết nối với IoT Gateway trên Laptop, đang thử kết nối lại...")
                sock = connect_gateway()
                if sock is None:
                    time.sleep(5)
                    continue
            try:
                # Chuẩn bị và gửi dữ liệu cảm biến
                dht_sensor.measure()
                temperature = dht_sensor.temperature()
                humidity = dht_sensor.humidity()
                counter += 1
                
                data = {
                    "counter": counter,
                    "temperature": temperature,
                    "humidity": humidity
                }
                json_data = json.dumps(data)
                print("Gửi dữ liệu:", json_data)
                sock.send(json_data.encode())
                
                # Đợi xác nhận từ gateway ........................................................................
                sock.settimeout(5)
                try:
                    response = sock.recv(1024).decode().strip()
                    print("Phản hồi từ Gateway:", response)
                    # Giao tiếp thành công - đợi trước khi gửi dữ liệu tiếp theo
                    time.sleep(2)
                except socket.timeout:
                    print("Timeout khi đợi phản hồi từ Gateway.")
                    # Không có phản hồi - xem xét việc kết nối lại
                    sock.close()
                    sock = None
                    continue
                oled.fill(0)
                oled.text("SendtoGateway:", 0, 0)
                oled.text(f"Temp: {temperature}C", 0, 10)
                oled.text(f"Hum: {humidity}%", 0, 20)
                oled.text(f"Count: {counter}", 0, 30)
                oled.show()
                
            except (OSError, BrokenPipeError, ConnectionResetError) as e:
                print(f"Lỗi gửi dữ liệu: {e}, đóng kết nối và thử lại...")
                if sock:
                    sock.close()
                sock = None
                time.sleep(2) 
                
        except Exception as e:
            print(f"Lỗi trong vòng lặp chính: {e}")
            if sock:
                sock.close()
            sock = None
            time.sleep(5)
            
except KeyboardInterrupt:
    print("\nNgắt kết nối từ bàn phím.")

finally:
    print("Đóng kết nối.")
    if sock:
        sock.close()