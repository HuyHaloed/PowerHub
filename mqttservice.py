import os
import ssl
import paho.mqtt.client as mqtt
import requests

# === Thiết lập từ biến môi trường hoặc giá trị mặc định ===
ADAFRUIT_USERNAME = 'Hellosine'
ADAFRUIT_IO_KEY   = 'aio_wWwy72SXwCLMl1adccXdnXclQk26'

MQTT_BROKER = 'io.adafruit.com'
MQTT_PORT   = 1883
ADAFRUIT_IO_BASE_URL = "https://io.adafruit.com/api/v2"

# === Callback khi kết nối thành công ===
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print('Đã kết nối tới Adafruit IO MQTT Broker')
    else:
        print(f'Kết nối lỗi, mã trả về: {rc}')

# === Callback khi có lỗi log (bao gồm error) ===
def on_log(client, userdata, level, buf):
    if level == mqtt.MQTT_LOG_ERR:
        print('MQTT Error:', buf)

# === Khởi tạo client và cấu hình TLS + xác thực ===
client = mqtt.Client()
client.username_pw_set(ADAFRUIT_USERNAME, ADAFRUIT_IO_KEY)

# Dùng TLS mặc định
# client.tls_set_context(ssl.create_default_context())

client.on_connect = on_connect
client.on_log     = on_log

# Kết nối và chạy loop trong background
client.connect(MQTT_BROKER, MQTT_PORT)
client.loop_start()

def publish_to_feed(feed: str, payload: str) -> None:
    """
    Gửi payload (chuỗi) tới feed name trên Adafruit IO.
    
    Ví dụ feed="temperature" sẽ publish lên topic:
      <USERNAME>/feeds/temperature
    """
    if payload is None:
        return
    topic = f"{ADAFRUIT_USERNAME}/feeds/{feed}"
    result = client.publish(topic, payload)
    
    # result: tuple (rc, mid)
    if result.rc != mqtt.MQTT_ERR_SUCCESS:
        print('Lỗi gửi MQTT:', mqtt.error_string(result.rc))
    else:
        print(f'Đã gửi "{payload}" đến "{topic}"')

def get_latest_from_feed(feed: str) -> str:
    """
    Lấy giá trị mới nhất từ feed trên Adafruit IO.
    """
    url = f"{ADAFRUIT_IO_BASE_URL}/{ADAFRUIT_USERNAME}/feeds/{feed}/data/last"
    headers = {"X-AIO-Key": ADAFRUIT_IO_KEY}
    try:
        resp = requests.get(url, headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return data.get("value")
    except Exception as e:
        print(f"Lỗi lấy dữ liệu từ feed '{feed}': {e}")
        return None

def get_temperature():
    return get_latest_from_feed("temperature")

def get_energy_consumption():
    return get_latest_from_feed("energy")

def get_humidity():
    return get_latest_from_feed("humidity")

def get_brightness():
    return get_latest_from_feed("brightness")

def turn_on_fan():
    """
    Bật quạt (gửi '1' tới feed Fan)
    """
    publish_to_feed('Fan', 'ON')

def turn_off_fan():
    """
    Tắt quạt (gửi '0' tới feed Fan)
    """
    publish_to_feed('Fan', 'OFF')

def turn_on_light():
    """
    Bật đèn (gửi '1' tới feed Light)
    """
    publish_to_feed('Light', 'ON')

def turn_off_light():
    """
    Tắt đèn (gửi '0' tới feed Light)
    """
    publish_to_feed('Light', 'OFF')

# Nếu script này được chạy trực tiếp, ví dụ:
if __name__ == '__main__':
    import time
    # Test gửi thử
    publish_to_feed('test', 'Hello from Python!')
    time.sleep(1)  # chờ gửi xong
    client.loop_stop()
    client.disconnect()
