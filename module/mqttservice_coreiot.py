import paho.mqtt.client as mqtt
import requests

# === Cấu hình ThingsBoard Cloud ===
THINGSBOARD_HOST = "app.coreiot.io"
THINGSBOARD_PORT = 1883
ACCESS_TOKEN = "YfqcaVP6v7z5JCJAs8C8"  # Thay bằng access token của thiết bị trên ThingsBoard
JWT_TOKEN = "Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ2dS5uZ3V5ZW5jb25nQGhjbXV0LmVkdS52biIsInVzZXJJZCI6IjQ1ZTkzYzcwLWUxZGQtMTFlZi1hZDA5LTUxNWY3OTBlZDlkZiIsInNjb3BlcyI6WyJURU5BTlRfQURNSU4iXSwic2Vzc2lvbklkIjoiZTcyNGZlYjUtNjQ2Ni00NjhmLWJhYmUtYjNhZDQzNDk0N2ViIiwiZXhwIjoxNzQ2ODExNjYwLCJpc3MiOiJjb3JlaW90LmlvIiwiaWF0IjoxNzQ2ODAyNjYwLCJmaXJzdE5hbWUiOiJWxakiLCJsYXN0TmFtZSI6Ik5ndXnhu4VuIEPDtG5nIiwiZW5hYmxlZCI6dHJ1ZSwiaXNQdWJsaWMiOmZhbHNlLCJ0ZW5hbnRJZCI6IjQ1ZTE3NDQwLWUxZGQtMTFlZi1hZDA5LTUxNWY3OTBlZDlkZiIsImN1c3RvbWVySWQiOiIxMzgxNDAwMC0xZGQyLTExYjItODA4MC04MDgwODA4MDgwODAifQ.0Ds4hLKL5tzB7Eyp4Glaw-3MGxvS0_1Sz5U2i7vcbT_qdeHE3e2LwE5W8sr8r6TO8MmQGy0MBvb7j6B0YIa_pw"
DEVICE_ID = "3800b260-2a52-11f0-a3c9-ab0d8999f561"  # Thay bằng deviceId của thiết bị trên ThingsBoard
# === MQTT client setup ===
client = mqtt.Client()
client.username_pw_set(ACCESS_TOKEN)

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Đã kết nối tới ThingsBoard Cloud MQTT Broker")
    else:
        print(f"Kết nối lỗi, mã trả về: {rc}")

client.on_connect = on_connect

client.connect(THINGSBOARD_HOST, THINGSBOARD_PORT)
client.loop_start()

def publish_telemetry(payload: dict):
    """
    Gửi dữ liệu telemetry lên ThingsBoard.
    payload: dict, ví dụ {"temperature": 25}
    """
    import json
    topic = "v1/devices/me/telemetry"
    result = client.publish(topic, json.dumps(payload))
    if result.rc != mqtt.MQTT_ERR_SUCCESS:
        print('Lỗi gửi MQTT:', mqtt.error_string(result.rc))
    else:
        print(f'Đã gửi telemetry: {payload}')

def publish_attribute(payload: dict):
    """
    Gửi thuộc tính (attributes) lên ThingsBoard.
    """
    import json
    topic = "v1/devices/me/attributes"
    result = client.publish(topic, json.dumps(payload))
    if result.rc != mqtt.MQTT_ERR_SUCCESS:
        print('Lỗi gửi MQTT:', mqtt.error_string(result.rc))
    else:
        print(f'Đã gửi attribute: {payload}')

def get_latest_telemetry(key: str, jwt_token: str, device_id: str):
    """
    Lấy giá trị telemetry mới nhất qua REST API (cần JWT token và deviceId).
    """
    url = f"https://{THINGSBOARD_HOST}/api/plugins/telemetry/DEVICE/{device_id}/values/timeseries?keys={key}"
    headers = {
        "X-Authorization": f"{jwt_token}"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        # Dữ liệu trả về dạng: {"temperature": [{"ts":..., "value":...}], ...}
        if key in data and isinstance(data[key], list) and data[key]:
            return data[key][0].get("value")
        else:
            print(f"Không tìm thấy telemetry '{key}'")
            return None
    except Exception as e:
        print(f"Lỗi lấy dữ liệu telemetry '{key}': {e}")
        return None

def get_temperature():
    """
    Lấy giá trị temperature telemetry mới nhất.
    """
    return get_latest_telemetry("temperature", JWT_TOKEN, DEVICE_ID)

def get_humidity():
    """
    Lấy giá trị humidity telemetry mới nhất.
    """
    return get_latest_telemetry("humidity", JWT_TOKEN, DEVICE_ID)

# Nếu chạy trực tiếp
if __name__ == "__main__":
    import time
    publish_telemetry({"temperature": 30})
    publish_telemetry({"humidity": 60})
    print("Giá trị nhiệt độ mới nhất:", get_temperature())
    print("Giá trị độ ẩm mới nhất:", get_humidity())
    time.sleep(1)
    client.loop_stop()
    client.disconnect()
