from ssd1306 import SSD1306_I2C
from machine import Pin
import dht
from pins import *  # Giả sử bạn có file pins.py định nghĩa các chân
import network
import socket
import time
import json
import uasyncio as asyncio

# Thông tin WiFi
SSID = "Bonjour"
PASSWORD = "hellosine"
IOTGATEWAY_IP = "10.0.130.233"
IOTGATEWAY_PORT = 12345

# Định nghĩa danh sách thuộc tính và RPC
ATTRIBUTE = ['sharedvalueLight', 'sharedvalueFan']
TELEMETRY = ['temperature', 'humidity']
RPC_METHOD = ['setValueLight', 'setValueFan']

# Biến toàn cục
Light = False
Fan = False

class Client_Device:
    def __init__(self, ssid, password, gateway_ip, gateway_port):
        self.ssid = ssid
        self.password = password
        self.gateway_ip = gateway_ip
        self.gateway_port = gateway_port
        self.wifi = None
        self.sock = None
        self.connected = False

    def connect_wifi(self, max_attempts=20):
        self.wifi = network.WLAN(network.STA_IF)
        self.wifi.active(True)
        self.wifi.connect(self.ssid, self.password)
        attempts = 0
        while not self.wifi.isconnected() and attempts < max_attempts:
            print(f"Đang kết nối WiFi... ({attempts+1}/{max_attempts})")
            time.sleep(1)
            attempts += 1
        if self.wifi.isconnected():
            print("Kết nối WiFi thành công:", self.wifi.ifconfig()[0])
            return True
        print("Lỗi: Không thể kết nối WiFi.")
        return False

    def connect_gateway(self, max_attempts=10):
        if self.sock:
            self.sock.close()
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        attempts = 0
        while attempts < max_attempts:
            try:
                print(f"Đang kết nối IoT Gateway... ({attempts+1}/{max_attempts})")
                self.sock.connect((self.gateway_ip, self.gateway_port))
                self.connected = True
                print("Kết nối IoT Gateway thành công!")
                return True
            except Exception as e:
                print(f"Lỗi kết nối: {e}")
                time.sleep(2)
                attempts += 1
        print("Lỗi: Không thể kết nối IoT Gateway.")
        self.sock = None
        self.connected = False
        return False

    async def send_data(self, data, retries=3):
        if not self.wifi or not self.wifi.isconnected():
            if not self.connect_wifi():
                return None
        if not self.connected:
            if not self.connect_gateway():
                return None
        for attempt in range(retries):
            try:
                payload = f"{data['type']}:{json.dumps(data['data'])}\n"
                self.sock.sendall(payload.encode('utf-8'))
                self.sock.settimeout(10)
                response = self.sock.recv(1024).decode().strip()
                print(f"Phản hồi từ Gateway: {response}")
                # Xử lý phản hồi
                response_data = json.loads(response)
                if response_data.get("status") == "success":
                    # Kiểm tra và xử lý RPC call nếu có
                    rpc_info = response_data.get("rpc")
                    if rpc_info:
                        method = rpc_info.get("method")
                        params = rpc_info.get("params")
                        print(f"Nhận RPC từ Gateway: method={method}, params={params}")
                        await on_rpc_request(method, params)
                    return response
                else:
                    print(f"Cảnh báo: Gateway báo lỗi - {response_data.get('message')}")
                    return None
            except Exception as e:
                print(f"Lỗi gửi dữ liệu (lần {attempt+1}/{retries}): {e}")
                self.connected = False
                self.sock = None
                if attempt < retries - 1:
                    await asyncio.sleep_ms(2000)
                    self.connect_gateway()
                else:
                    return None

    async def request_attributes(self, keys, callback):
        payload = {"type": "ATTRIBUTE_REQUEST", "data": {"keys": keys}}
        response = await self.send_data(payload)
        if response:
            try:
                print(f"Dữ liệu nhận được: '{response}'")
                response = json.loads(response.strip())
                await callback(response, None)
            except Exception as e:
                print(f"Lỗi parse JSON: {e}")
                await callback(None, e)
        else:
            await callback(None, "Không nhận được phản hồi từ Gateway")

async def control_light():
    global Light
    print('Light:', 'ON' if Light else 'OFF')

async def control_fan():
    global Fan
    pin_D13.write_digital(1 if Fan else 0)

async def update_state(key, value):
    global Light, Fan
    if key == 'Light':
        payload = {"type": "ATTRIBUTE", "data": {"sharedvalueLight": Light}}
    elif key == 'Fan':
        payload = {"type": "ATTRIBUTE", "data": {"sharedvalueFan": Fan}}
    await yolo.send_data(payload)

async def on_shared_attributes_response(attributes, exception):
    global Light, Fan
    if exception:
        print("Lỗi lấy attributes:", exception)
        return
    shared = attributes.get('shared', {})
    if 'sharedvalueLight' in shared:
        Light = shared['sharedvalueLight']
        await control_light()
    if 'sharedvalueFan' in shared:
        Fan = shared['sharedvalueFan']
        await control_fan()

async def on_rpc_request(method, params):
    global Light, Fan
    if method == 'setValueLight':
        Light = params
        await control_light()
        await update_state('Light', Light)
    elif method == 'setValueFan':
        Fan = params
        await control_fan()
        await update_state('Fan', Fan)

async def task_dht():
    while True:
        try:
            dht_D3.measure()
            temp = dht_D3.temperature()
            humid = dht_D3.humidity()
            oled.fill(0)
            oled.text(f'Temp: {temp}C', 0, 0, 1)
            oled.text(f'Humid: {humid}%', 0, 10, 1)
            oled.text(f'Light: {"1" if Light else "0"}', 0, 20, 1)
            oled.text(f'Fan: {"1" if Fan else "0"}', 64, 20, 1)
            oled.show()
            telemetry_data = {
                "type": "TELEMETRY",
                "data": {"temperature": temp, "humidity": humid}
            }
            await yolo.send_data(telemetry_data)
            await asyncio.sleep_ms(2000)
        except Exception as e:
            print(f"Lỗi trong task DHT: {e}")
            await asyncio.sleep_ms(5000)

async def setup():
    global yolo, dht_D3, pin_D13, oled
    yolo = Client_Device(SSID, PASSWORD, IOTGATEWAY_IP, IOTGATEWAY_PORT)
    dht_D3 = dht.DHT11(Pin(D3_PIN))
    pin_D13 = Pins(D13_PIN)
    oled = SSD1306_I2C()
    oled.text('Initializing...', 0, 0, 1)
    oled.show()
    yolo.connect_wifi()
    oled.fill(0)
    oled.text('Connected!', 0, 0, 1)
    oled.show()
    await yolo.request_attributes(ATTRIBUTE, on_shared_attributes_response)
    asyncio.create_task(task_dht())

async def main():
    await setup()
    while True:
        await asyncio.sleep_ms(100)

# Hàm chạy asyncio loop (giả sử có sẵn trong môi trường MicroPython của bạn)
def run_loop(coro):
    asyncio.run(coro)

run_loop(main())