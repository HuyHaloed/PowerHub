from ssd1306 import *
from wifi import *
from machine import Pin
import dht
from pins import *
import network
import socket
import time
import json  # Thêm import json
import _thread

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

# Quản lí shared attribute, telemetry và rpc call.
ATTRIBUTE = ['sharedvalueLight', 'sharedvalueFan']
TELEMETRY = ['temperature', 'humidity']
RPC_METHOD = ['setvalueLight', 'setvalueFan']

# Biến toàn cục trong yolo
x = ''
Light = False
Fan = False

class Client_Device:
    def __init__(self, SSID, PASSWORD, GATEWAY_IP, GATEWAY_PORT):
        self.SSID = SSID
        self.PASSWORD = PASSWORD
        self.GATEWAY_IP = GATEWAY_IP
        self.GATEWAY_PORT = GATEWAY_PORT
        self.wifi = None
        self.sock = self.connect_gateway()

    # Kết nối WiFi
    def connect_wifi(self,max_attempts=20):
        self.wifi = network.WLAN(network.STA_IF)
        self.wifi.active(True)
        self.wifi.connect(SSID, PASSWORD)
        
        attempts = 0
        while not self.wifi.isconnected() and attempts < max_attempts:
            print(f"Đang kết nối WiFi... ({attempts+1}/{max_attempts})")
            time.sleep(1)
            attempts += 1
        if self.wifi.isconnected():
            print("Kết nối WiFi thành công!")
            print("Địa chỉ IP ESP32-S3:", self.wifi.ifconfig()[0])
            return self.wifi
        else:
            print("Lỗi: Không thể kết nối WiFi.")
            return None  # Trả về None để kiểm tra sau

    # Kết nối đến IOTgateway
    def connect_gateway(self, max_attempts=10, wait_time=3) -> socket.socket:
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

    # Gửi yêu cầu lấy thuộc tính đến IoT Gateway
    async def request_attributes(self, keys: list, callback):
        ###TODO: chuỗi request_payload có cấu trúc ví dụ như {'request' + ',' + ATTRIBUTE[0] + ',' + ATTRIBUTE[1]}
        request_payload = {'ATTRIBUTE' + ',' + keys}
        ##########
        self.send_data(request_payload)
        self.sock.settimeout(10)
        try:
            response = self.sock.recv(1024)
            response = json.loads(response)
            callback(response, None)
        except Exception as e:
            callback(None, e)

    # Gửi dữ liệu đến IOTgateway với data theo cấu trúc ['type' + ':' + {'name1':'value1', 'name2':'value2', 'name3':'value3'}]
    # với:  type là ['ATTRIBUTE', 'TELEMETRY', 'RPC_METHOD']
    #       name là tên của một phần tử trong mảng ATTRIBUTE, TELEMETRY hoặc RPC_METHOD
    #       value là giá trị của phần tử đó
    async def send_data(self, data):
        try:

            self.send_data(json.dumps(data).encode('utf-8'))
            self.sock.settimeout(5)
            try:
                response = self.sock.recv(1024).decode().strip()
                print(f"Phản hồi từ Gateway: {response}")
            except socket.timeout:
                print("Timeout khi đợi phản hồi từ Gateway.")
                # Không có phản hồi - xem xét việc kết nối lại
                self.sock.close()
                self.sock = None
        except (OSError, BrokenPipeError, ConnectionResetError) as e:
            print(f"Lỗi gửi dữ liệu: {e}, đóng kết nối và thử lại...")
            if self.sock:
                self.sock.close()
            self.sock = None
            time.sleep(2)
    async def set_rpc_request_handler(method: str, callback):
        print("Xử lí RPC request")
        if method == 'setvalueLight':
            await on_sharevalueLight_attribute_update(callback)
        elif method == 'setvalueFan':
            await on_sharevalueFan_attribute_update(callback)
        else:
            print(f"Unknown RPC method: {method}")
        

async def UpdateState(x):
    global Light, Fan
    if x == 'Light':
        #TODO: dùng hàm send_data() gửi giá trị Light của shared attribute là sharedvalueLight
        print("Update value Light on CoreIOT")
    elif x == 'Fan':
        #TODO: dùng hàm send_data() gửi giá trị Fan của shared attribute là sharedvalueLight
        print("Update value Fan on CoreIOT")

async def controlFan():
    global Light, Fan
    if Fan == False:
        pin_D13.write_digital(0)
    else:
        pin_D13.write_digital(1)

async def controlLight():
    global Light, Fan
    if Light == False:
        print('Light turn off')
    else:
        print('Light turn on')

async def on_shared_attributes_response(attributes, exception):
    global Light, Fan
    
    if exception:
        print("Error fetching shared attributes:", exception)
        return

    if 'sharedvalueLight' in attributes.get('shared', {}):
        Light = attributes['shared']['sharedvalueLight']
        print("Updated Light from server:", Light)
        await controlLight()

    if 'sharedvalueFan' in attributes.get('shared', {}):
        Fan = attributes['shared']['sharedvalueFan']
        print("Updated Fan from server:", Fan)
        await controlFan()

async def on_sharevalueLight_attribute_update(attributes, exception):
    global Light, Fan
    await UpdateState('Light')

async def on_sharevalueFan_attribute_update(attributes, exception):
    global Light, Fan
    await UpdateState('Fan')

async def on_rpc_request_setValueLight(request_id, request_body):
    global Light, Fan
    print('Received rpc for light:')
    print(str((request_body['params'])))
    Light = request_body['params']
    await controlLight()
    await UpdateState('Light')

async def on_rpc_request_setValueFan(request_id, request_body):
    global Light, Fan
    print('Received rpc for fan:')
    print(str((request_body['params'])))
    Fan = request_body['params']
    await controlFan()
    await UpdateState('Fan')


yolo = Client_Device('Bonjour', 'hellosine', IOTGATEWAY_IP, IOTGATEWAY_PORT)

try:
    dht_D3 = dht.DHT11(Pin(D3_PIN))             # Khởi tạo cảm biến DHT11
    pin_D13 = Pins(D13_PIN)                     # Khởi tạo chân điều khiển Relay
except Exception as e:
    print(f"Lỗi khởi tạo chân DHT hoặc chân điều khiển Relay: {e}")
# Khởi tạo màn hình OLED (I2C)
try:
    oled = SSD1306_I2C()
except Exception as e:
    print(f"Lỗi OLED: {e}")

# taskDHT: Gửi telemetry data từ Yolo Uno đến IOTgateway
async def task_b_I_T_M():
    global x, Light, Fan
    counter = 0  # Biến đếm số lần gửi dữ liệu
    while True:
        try:
            if not wifi.isconnected():
                print("Mất kết nối tới WiFi! Đang thử kết nối lại...")
                wifi = yolo.connect_wifi()
                if wifi is None:
                    continue 
            if sock is None:
                print("Không có kết nối với IoT Gateway trên Laptop, đang thử kết nối lại...")
                sock = yolo.connect_gateway()
                if sock is None:
                    time.sleep(5)
                    continue
            try:
                await asleep_ms(2000)
                dht_D3.measure()
                oled.fill(0)
                oled.text('Temp: {}C'.format(dht_D3.temperature()), 0, 0, 1)
                oled.text('Humid: {}%'.format(dht_D3.humidity()), 0, 10, 1)
                oled.text('Light:{}'.format('1' if Light else '0'), 0, 20, 1)
                oled.text('Fan:{}'.format('1' if Fan else '0'), 64, 20, 1)
                oled.show()

                # Gửi dữ liệu đến IoT Gateway
                data = {
                    "type": 'ATTRIBUTE',
                    "counter": counter,
                    "temperature": dht_D3.temperature(),
                    "humidity": dht_D3.humidity(),
                    "light": Light,
                    "fan": Fan
                }
                # Gửi telemetry_data cho IOTgateway
                # TODO: dùng hàm send_data() gửi dữ liệu telemetry_data
                yolo.send_data(data)

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


async def setup():
    global Light, Fan
    print('App started')
    oled.text('Initializing...', 0, 0, 1)
    oled.show()
    
    neopix.show(0, hex_to_rgb('#ff0000'))

    await yolo.connect_wifi()
    
    neopix.show(0, hex_to_rgb('#00ff00'))
    oled.fill(0)
    oled.text('Connected!', 0, 0, 1)
    oled.show()
    Light = False
    Fan = False
    
    # await request_shared_attributes(['sharedvalueLight', 'sharedvalueFan'], on_shared_attributes_response)
    await yolo.request_attributes(['sharedvalueLight', 'sharedvalueFan'], on_shared_attributes_response)
    
    yolo.set_rpc_request_handler('setValueLight', on_rpc_request_setValueLight)
    yolo.set_rpc_request_handler('setValueFan', on_rpc_request_setValueFan)

    create_task(task_b_I_T_M())
    # create_task(check_fan_schedule())

async def main():
    await setup()
    while True:
        await asleep_ms(100)

run_loop(main())