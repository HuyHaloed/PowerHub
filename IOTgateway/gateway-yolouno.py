# import serial

# # Cấu hình cổng serial (Cập nhật lại tên cổng nếu cần)
# SERIAL_PORT = "COM12"  # Trên Windows (Dùng 'COMx' tùy theo cổng)
# # SERIAL_PORT = "/dev/ttyUSB0"  # Trên Linux/macOS
# BAUD_RATE = 115200
<<<<<<< HEAD

# try:
#     ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
#     print(f"Đang chờ dữ liệu từ ESP32-S3 trên {SERIAL_PORT}...")
    
#     while True:
#         if ser.in_waiting > 0:
#             data = ser.readline().decode().strip()  # Đọc dữ liệu từ ESP32-S3
#             print(f"Dữ liệu nhận được: {data}")

# except serial.SerialException as e:
#     print(f"Lỗi Serial: {e}")

# except KeyboardInterrupt:
#     print("\nĐóng cổng serial.")
#     ser.close()

# import serial
# import time

# # Cấu hình cổng Serial (Thay đổi COMx hoặc /dev/ttyUSBx nếu cần)
# SERIAL_PORT = "COM12"  # Windows (Dùng 'COMx' tùy theo cổng)
# # SERIAL_PORT = "/dev/ttyUSB0"  # Linux/macOS
# BAUD_RATE = 115200

# try:
#     ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
#     print(f"Kết nối Serial thành công trên {SERIAL_PORT}")

#     while True:
#         # Gửi lệnh đến ESP32-S3
#         command = input("Nhập lệnh gửi ESP32-S3: ")
#         ser.write((command + "\n").encode())  # Gửi dữ liệu

#         # Nhận phản hồi từ ESP32-S3
#         time.sleep(1)  # Đợi ESP32-S3 xử lý
#         while ser.in_waiting > 0:
#             response = ser.readline().decode().strip()
#             print(f"ESP32-S3 trả lời: {response}")

# except serial.SerialException as e:
#     print(f"Lỗi Serial: {e}")

# except KeyboardInterrupt:
#     print("\nĐóng kết nối Serial.")
#     ser.close()

############### Lắng nghe YoloUno ver1 ###############
# import socket
# import time

# ESP32_IP = "192.168.137.199"  # Địa chỉ IP của ESP32-S3 (thay thế bằng IP thực tế)
# ESP32_PORT = 12345  # Cổng TCP của ESP32-S3

# # Kết nối tới ESP32-S3
# client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# client_socket.connect((ESP32_IP, ESP32_PORT))
# print("Kết nối thành công đến ESP32-S3!")

# try:
#     while True:
#         data = input("Nhập dữ liệu gửi đến ESP32-S3: ")
#         client_socket.send(data.encode())  # Gửi dữ liệu đến ESP32-S3
#         print(f"Đã gửi: {data}")

#         # Nhận phản hồi từ ESP32-S3
#         response = client_socket.recv(1024).decode()
#         print("ESP32 trả lời:", response)

# except KeyboardInterrupt:
#     print("\nĐóng kết nối")
#     client_socket.close()

############### Gửi nhận data với YoloUno ver2 ###############
# import socket
# import time

# ESP32_IP = "192.168.137.199"  # Địa chỉ IP của ESP32-S3 (thay thế bằng IP thực tế)
# ESP32_PORT = 12345  # Cổng TCP của ESP32-S3

# # Kết nối tới ESP32-S3
# client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# client_socket.connect((ESP32_IP, ESP32_PORT))
# print("Kết nối thành công đến ESP32-S3!")

# try:
#     while True:
#         # Nhập dữ liệu gửi đến ESP32-S3
#         data = input("Nhập dữ liệu gửi đến ESP32-S3: ")
#         client_socket.send(data.encode())  # Gửi dữ liệu đến ESP32-S3
#         print(f"Đã gửi: {data}")

#         # Nhận phản hồi từ ESP32-S3
#         response = client_socket.recv(1024).decode()
#         print("ESP32 trả lời:", response)

#         # Nhận dữ liệu đếm từ ESP32-S3
#         counter_data = client_socket.recv(1024).decode()
#         print("Nhận từ ESP32:", counter_data)

# except KeyboardInterrupt:
#     print("\nĐóng kết nối")
#     client_socket.close()

############### Gửi nhận data với YoloUno ver3 ###############
############### Kết nối wifi  ###############
import socket
import time

# Cấu hình server
HOST = ''  # Lắng nghe trên tất cả các địa chỉ IP
PORT = 12345  # Cổng nhận kết nối từ ESP32-S3

def start_server():
    """Khởi động server TCP và chờ kết nối từ ESP32-S3"""
    server_socket = None  # Biến lưu socket chính

    try:
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_socket.bind((HOST, PORT))
        server_socket.listen(1)
        server_socket.settimeout(2.0)  # Đặt timeout để không bị chặn mãi mãi
        print("IoT Gateway đang chờ kết nối... (Nhấn Ctrl+C để dừng)")

        while True:
            try:
                try:
                    conn, addr = server_socket.accept()
                    print(f"Kết nối từ ESP32-S3: {addr}")
                    conn.settimeout(2.0)  # Đặt timeout để tránh treo khi đọc dữ liệu

                    while True:
                        try:
                            data = conn.recv(1024).decode().strip()
                            if not data:
                                raise ConnectionResetError("ESP32-S3 đã đóng kết nối")

                            print("Nhận dữ liệu:", data)

                            # Phản hồi lại ESP32-S3
                            response = f"Gateway nhận: {data}"
                            print("Gửi phản hồi:", response)
                            conn.sendall(response.encode())

                        except socket.timeout:
                            print("socket timeout")
                            continue  # Tiếp tục vòng lặp nếu không có dữ liệu mà không treo chương trình
                        except ConnectionResetError as e:
                            print(f"Mất kết nối từ ESP32-S3: {e}")
                            break  # Thoát vòng lặp để chờ kết nối mới
                        except Exception as e:
                            print(f"Lỗi nhận dữ liệu: {e}")
                            break

                    print("Đóng kết nối, chờ ESP32-S3 kết nối lại...")
                    conn.close()

                except socket.timeout:
                    continue  # Tránh bị chặn mãi mãi khi chờ kết nối mới

            except Exception as e:
                print(f"Lỗi server: {e}")
                time.sleep(5)  # Chờ 5 giây rồi thử lại

            # except KeyboardInterrupt:
            #     print("\nNgắt kết nối từ bàn phím. Đang đóng server...")
            #     break  # Thoát vòng lặp chính để dừng server


    except KeyboardInterrupt:
        print("\nNgắt từ bàn phím. Đóng server...")
    except Exception as e:
        print(f"Lỗi khởi động server: {e}")

    finally:
        if server_socket:
            server_socket.close()  # Đóng socket chính trước khi thoát
        print("Server đã tắt.")

if __name__ == "__main__":
    start_server()
=======

# try:
#     ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
#     print(f"Đang chờ dữ liệu từ ESP32-S3 trên {SERIAL_PORT}...")
    
#     while True:
#         if ser.in_waiting > 0:
#             data = ser.readline().decode().strip()  # Đọc dữ liệu từ ESP32-S3
#             print(f"Dữ liệu nhận được: {data}")

# except serial.SerialException as e:
#     print(f"Lỗi Serial: {e}")

# except KeyboardInterrupt:
#     print("\nĐóng cổng serial.")
#     ser.close()

# import serial
# import time

# # Cấu hình cổng Serial (Thay đổi COMx hoặc /dev/ttyUSBx nếu cần)
# SERIAL_PORT = "COM12"  # Windows (Dùng 'COMx' tùy theo cổng)
# # SERIAL_PORT = "/dev/ttyUSB0"  # Linux/macOS
# BAUD_RATE = 115200

# try:
#     ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
#     print(f"Kết nối Serial thành công trên {SERIAL_PORT}")

#     while True:
#         # Gửi lệnh đến ESP32-S3
#         command = input("Nhập lệnh gửi ESP32-S3: ")
#         ser.write((command + "\n").encode())  # Gửi dữ liệu

#         # Nhận phản hồi từ ESP32-S3
#         time.sleep(1)  # Đợi ESP32-S3 xử lý
#         while ser.in_waiting > 0:
#             response = ser.readline().decode().strip()
#             print(f"ESP32-S3 trả lời: {response}")

# except serial.SerialException as e:
#     print(f"Lỗi Serial: {e}")

# except KeyboardInterrupt:
#     print("\nĐóng kết nối Serial.")
#     ser.close()

############### Lắng nghe YoloUno ver1 ###############
# import socket
# import time

# ESP32_IP = "192.168.137.199"  # Địa chỉ IP của ESP32-S3 (thay thế bằng IP thực tế)
# ESP32_PORT = 12345  # Cổng TCP của ESP32-S3

# # Kết nối tới ESP32-S3
# client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# client_socket.connect((ESP32_IP, ESP32_PORT))
# print("Kết nối thành công đến ESP32-S3!")

# try:
#     while True:
#         data = input("Nhập dữ liệu gửi đến ESP32-S3: ")
#         client_socket.send(data.encode())  # Gửi dữ liệu đến ESP32-S3
#         print(f"Đã gửi: {data}")

#         # Nhận phản hồi từ ESP32-S3
#         response = client_socket.recv(1024).decode()
#         print("ESP32 trả lời:", response)

# except KeyboardInterrupt:
#     print("\nĐóng kết nối")
#     client_socket.close()

############### Gửi nhận data với YoloUno ver2 ###############
# import socket
# import time

# ESP32_IP = "192.168.137.199"  # Địa chỉ IP của ESP32-S3 (thay thế bằng IP thực tế)
# ESP32_PORT = 12345  # Cổng TCP của ESP32-S3

# # Kết nối tới ESP32-S3
# client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# client_socket.connect((ESP32_IP, ESP32_PORT))
# print("Kết nối thành công đến ESP32-S3!")

# try:
#     while True:
#         # Nhập dữ liệu gửi đến ESP32-S3
#         data = input("Nhập dữ liệu gửi đến ESP32-S3: ")
#         client_socket.send(data.encode())  # Gửi dữ liệu đến ESP32-S3
#         print(f"Đã gửi: {data}")

#         # Nhận phản hồi từ ESP32-S3
#         response = client_socket.recv(1024).decode()
#         print("ESP32 trả lời:", response)

#         # Nhận dữ liệu đếm từ ESP32-S3
#         counter_data = client_socket.recv(1024).decode()
#         print("Nhận từ ESP32:", counter_data)

# except KeyboardInterrupt:
#     print("\nĐóng kết nối")
#     client_socket.close()

############### Gửi nhận data với YoloUno ver3 ###############
############### Kết nối wifi  ###############
# import paho.mqtt.client as mqttclient
# import json
# import time
# # import threading
# import socket
# # import queue

# # Cấu hình server
# HOST = ''  # Lắng nghe trên tất cả các địa chỉ IP
# PORT = 12345  # Cổng nhận kết nối từ ESP32-S3

# def process_yolouno_data(data):
#     """Continuously process data from queue and forward to CoreIOT"""
#     # while True:
#     try:
#         # with self.queue_lock:
#         #     data = self.data_queue.get()
#         print("get data from queue")
#         sensor_data = parse_sensor_data(data)
#         # if sensor_data:
#         #     self.latest_sensor_data.update(sensor_data)
#         #     self.coreiot_client.publish(
#         #         'v1/devices/me/telemetry',
#         #         json.dumps(sensor_data),
#         #         qos=1
#         #     )
#         print(f"Data forwarded to CoreIOT: {sensor_data}")
#     except Exception as e:
#         print(f"Data Processing Error: {e}")
#     time.sleep(0.1)

# def parse_sensor_data(self, data):
#     """
#     Parse incoming data from YoloUno.
#     Modify this method based on the actual data format from your YoloUno device.
#     """
#     try:
#         parsed_data = json.loads(data)
#         return parsed_data
#     except json.JSONDecodeError:
#         print(f"Không thể phân tích dữ liệu: {data}")
#         return None

# def start_server():
#     """Khởi động server TCP và chờ kết nối từ ESP32-S3"""
#     server_socket = None  # Biến lưu socket chính

#     try:
#         server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
#         server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
#         server_socket.bind((HOST, PORT))
#         server_socket.listen(1)
#         server_socket.settimeout(2.0)  # Đặt timeout để không bị chặn mãi mãi
#         print("IoT Gateway đang chờ kết nối... (Nhấn Ctrl+C để dừng)")

#         while True:
#             try:
#                 try:
#                     conn, addr = server_socket.accept()
#                     print(f"Kết nối từ ESP32-S3: {addr}")
#                     conn.settimeout(2.0)  # Đặt timeout để tránh treo khi đọc dữ liệu

#                     while True:
#                         try:
#                             data = conn.recv(1024).decode().strip()
#                             if not data:
#                                 raise ConnectionResetError("ESP32-S3 đã đóng kết nối")

#                             print("Nhận dữ liệu:", data)

#                             # Phản hồi lại ESP32-S3
#                             response = f"Gateway nhận: {data}"
#                             print("Gửi phản hồi:", response)
#                             conn.sendall(response.encode())

#                         except socket.timeout:
#                             print("socket timeout")
#                             continue  # Tiếp tục vòng lặp nếu không có dữ liệu mà không treo chương trình
#                         except ConnectionResetError as e:
#                             print(f"Mất kết nối từ ESP32-S3: {e}")
#                             break  # Thoát vòng lặp để chờ kết nối mới
#                         except Exception as e:
#                             print(f"Lỗi nhận dữ liệu: {e}")
#                             break

#                     print("Đóng kết nối, chờ ESP32-S3 kết nối lại...")
#                     conn.close()

#                 except socket.timeout:
#                     continue  # Tránh bị chặn mãi mãi khi chờ kết nối mới

#             except Exception as e:
#                 print(f"Lỗi server: {e}")
#                 time.sleep(5)  # Chờ 5 giây rồi thử lại

#             # except KeyboardInterrupt:
#             #     print("\nNgắt kết nối từ bàn phím. Đang đóng server...")
#             #     break  # Thoát vòng lặp chính để dừng server


#     except KeyboardInterrupt:
#         print("\nNgắt từ bàn phím. Đóng server...")
#     except Exception as e:
#         print(f"Lỗi khởi động server: {e}")

#     finally:
#         if server_socket:
#             server_socket.close()  # Đóng socket chính trước khi thoát
#         print("Server đã tắt.")

# if __name__ == "__main__":
#     start_server()

############### Gửi nhận data với YoloUno ver4 ###############
#################### Gửi nhận từ yolouno ####################
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
IOTGATEWAY_IP = "10.0.129.253"  # Thay bằng IP thực tế của IoT Gateway
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
>>>>>>> origin/cong-vu
