"# PowerHub" 
IOTgateway:
    Chạy trên máy tính nhúng (laptop)
    Làm trung gian gửi nhận dữ liệu giữa yolouno và CoreIOT
    Chạy mô hình AI để đưa ra phán đoán
    Gửi nhận dữ liệu với database

Yolouno:
    Chạy trên YoloUno (ESP32S3)
    Điều khiển thiết bị điện
    Gửi dữ liệu từ cảm biến đến IOTgateway
    Chạy mô hình AI con (có thể)
    Nhận yêu cầu đối với thiết bị từ CoreIOT thông qua IOTgateway

Thông tin về file:
IOTgateway: chạy trên laptop
    IOTgateway.py: file chạy IOTgateway 
    gateway-coreiot.py: check connectivity giữa iotgateway và coreiot
    gateway-yolouno.py: check connectivity giữa iotgateway và yolouno

yolouno: chạy trên yolouno
    yolo_uno.py: file chạy yolouno
    yolouno-gateway.py: check connectivity giữa iotgateway và yolouno