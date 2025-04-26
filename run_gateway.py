from iotgateway import IoTGateway

# Thay các thông tin dưới đây bằng thông tin thực tế của bạn
esp32_broker = "localhost"           # hoặc IP của ESP32
esp32_topic = "esp32/data"
tb_broker = "mqtt.thingsboard.cloud"
tb_access_token = "YOUR_THINGSBOARD_ACCESS_TOKEN"

gateway = IoTGateway(esp32_broker, esp32_topic, tb_broker, tb_access_token)
gateway.start()

# Giữ chương trình chạy
import time
while True:
    time.sleep(1)