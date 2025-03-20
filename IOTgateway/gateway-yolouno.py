import serial

# Cấu hình cổng serial (Cập nhật lại tên cổng nếu cần)
SERIAL_PORT = "COM12"  # Trên Windows (Dùng 'COMx' tùy theo cổng)
# SERIAL_PORT = "/dev/ttyUSB0"  # Trên Linux/macOS
BAUD_RATE = 115200

try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    print(f"Đang chờ dữ liệu từ ESP32-S3 trên {SERIAL_PORT}...")
    
    while True:
        if ser.in_waiting > 0:
            data = ser.readline().decode().strip()  # Đọc dữ liệu từ ESP32-S3
            print(f"Dữ liệu nhận được: {data}")

except serial.SerialException as e:
    print(f"Lỗi Serial: {e}")

except KeyboardInterrupt:
    print("\nĐóng cổng serial.")
    ser.close()
