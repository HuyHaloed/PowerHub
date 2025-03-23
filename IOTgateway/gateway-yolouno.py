# import serial

# # Cấu hình cổng serial (Cập nhật lại tên cổng nếu cần)
# SERIAL_PORT = "COM12"  # Trên Windows (Dùng 'COMx' tùy theo cổng)
# # SERIAL_PORT = "/dev/ttyUSB0"  # Trên Linux/macOS
# BAUD_RATE = 115200

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
