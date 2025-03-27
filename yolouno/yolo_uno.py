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
ATTRIBUTE = ['sharedvalueLight', 'sharedvalueFan', 'Start', 'End']

TELEMETRY_PORT = 5000         # Port cho telemetry
ATTRIBUTE_PORT = 5001         # Port cho attribute

class ClientDevice:
    def __init__(self, SSID, PASSWORD, GATEWAY_IP, GATEWAY_PORT):
        self.SSID = SSID
        self.PASSWORD = PASSWORD
        self.GATEWAY_IP = GATEWAY_IP
        self.GATEWAY_PORT = GATEWAY_PORT
        self.wifi = None
        self.sock = self.connect_gateway()

    # Kết nối WiFi
    async def connect_wifi(self,max_attempts=20):
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

    # Gửi yêu cầu lấy thuộc tính đến IoT Gateway
    async def request_attributes(self, keys :str, callback):
        request_id = int(time.time())
        request_payload = json.dumps({
            "id": request_id,
            "method": "getAttributes",
            "params": {
                "shared": keys
            }
        })
        self.sock.send(request_payload)
        self.sock.settimeout(10)
        try:
            response = self.sock.recv(1024)
            response = json.loads(response)
            callback(response, None)
        except Exception as e:
            callback(None, e)

    async def connect_gateway(self, type: str, max_attempts=10, wait_time=3) -> socket.socket:
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

    async def send_data(self, type : dict, data :dict):
        """
        Gửi dữ liệu đến IoT Gateway theo giao thức JSON qua TCP socket
        """
        try:
            self.sock.send(json.dumps(data).encode('utf-8'))
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

    async def send_telemetry(self, data : dict):
        try:
            while True:
                try:
                    if not wifi.isconnected():
                        print("Mất kết nối tới WiFi! Đang thử kết nối lại...")
                        wifi = self.connect_wifi()
                        if wifi is None:
                            continue 
                    if self.sock is None:
                        print("Không có kết nối với IoT Gateway trên Laptop, đang thử kết nối lại...")
                        self.sock = self.connect_gateway()
                        if self.sock is None:
                            time.sleep(5)
                            continue
                    # Gửi dữ liệu telemetry đến IoT Gateway
                    self.send_data(data)
                    break        # Hoàn thành gửi, thoát khỏi vòng lặp gửi dữ liệu    
                except Exception as e:
                    print(f"Lỗi khi send_telemetry: {e}")
                    if self.sock:
                        self.sock.close()
                    self.sock = None
                    time.sleep(5)
        except KeyboardInterrupt:
            print("\nNgắt kết nối từ bàn phím.")
    async def send_attributes(self, data):
        try:
            while True:
                try:
                    if not wifi.isconnected():
                        print("Mất kết nối tới WiFi! Đang thử kết nối lại...")
                        wifi = self.connect_wifi()
                        if wifi is None:
                            continue
                    if sock is None:
                        print("Không có kết nối với IoT Gateway trên Laptop, đang thử kết nối lại...")
                        sock = self.connect_gateway()
                        if sock is None:
                            time.sleep(5)
                            continue
                    # Gửi dữ liệu attribute đến IOTgateway
                    self.send_data(data)
                    break        # Hoàn thành gửi, thoát khỏi vòng lặp gửi dữ liệu
                except Exception as e:
                    print(f"Lỗi khi send_attributes: {e}")
                    if sock:
                        sock.close()
                    sock = None
                    time.sleep(5)
        except KeyboardInterrupt:
            print("\nNgắt kết nối từ bàn phím.")

    

async def UpdateState(x):
    global Light, Fan, Start, End
    if x == 'Light':
        await ci_client.send_attributes({'sharedvalueLight': Light})
    elif x == 'Fan':
        await ci_client.send_attributes({'sharedvalueFan': Fan})
    elif x == 'Start':
        await ci_client.send_attributes({'Start': Start})
    elif x == 'End':
        await ci_client.send_attributes({'End': End})

async def on_sharevalueLight_attribute_update(attributes, exception):
    global Light, Fan
    await UpdateState('Light')

async def on_rpc_request_setValueLight(request_id, request_body):
    global Light, Fan
    print('Received rpc for light:')
    print(str((request_body['params'])))
    Light = request_body['params']
    await controlLight()
    await UpdateState('Light')

async def on_sharevalueFan_attribute_update(attributes, exception):
    global Light, Fan
    await UpdateState('Fan')

async def controlLight():
    global Light, Fan
    if Light == False:
        print('Light turn off')
    else:
        print('Light turn on')

async def on_rpc_request_setValueFan(request_id, request_body):
    global Light, Fan
    print('Received rpc for fan:')
    print(str((request_body['params'])))
    Fan = request_body['params']
    await controlFan()
    await UpdateState('Fan')

async def controlFan():
    global Light, Fan
    if Fan == False:
        pin_D13.write_digital(0)
    else:
        pin_D13.write_digital(1)

async def request_shared_attributes(keys, callback):
    # await ci_client.request_attributes([], keys, callback)


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
    # if 'Start' in attributes.get('shared', {}):
    #     new_start = parse_datetime(attributes['shared']['Start'])
    #     if new_start != Start:
    #         Start = new_start
    #         print("Updated Start from server:", Start)
    #         await check_fan_schedule(force_update=True)

    # if 'End' in attributes.get('shared', {}):
    #     new_end = parse_datetime(attributes['shared']['End'])
    #     if new_end != End:
    #         End = new_end
    #         print("Updated End from server:", End)
    #         await check_fan_schedule(force_update=True)

# async def check_fan_schedule(force_update=False):
#     global Start, End, Fan
#     while True:
#         current_time = utime.time()
#         new_fan_state = Fan
        
#         if Start <= current_time <= End:
#             new_fan_state = True
#         else:
#             new_fan_state = False

#         if new_fan_state != Fan or force_update:
#             Fan = new_fan_state
#             await controlFan()
#             await UpdateState('Fan')
#             print(f"Fan state updated to {Fan} based on schedule")
        
#         force_update = False
#         await asleep_ms(60000)

x = None
Light = False
Fan = False
# ci_client = CIDeviceMqttClient('Bonjour', 'hellosine', 'ZS9KjbmsPcXtniB8q9yP', 'app.coreiot.io', 1883)
try:
    dht_D3 = dht.DHT11(Pin(D3_PIN))             # Khởi tạo cảm biến DHT11
    pin_D13 = Pins(D13_PIN)                     # Khởi tạo chân điều khiển Relay
except Exception as e:
    print(f"Lỗi khởi tạo chân DHT hoặc chân điều khiển Relay: {e}")
# Khởi tạo màn hình OLED (I2C)
try:
    oled = SSD1306_I2C()
    oled.fill(0)
    oled.text("ESP32-S3 Ready", 0, 0)
    oled.show()
except Exception as e:
    print(f"Lỗi OLED: {e}")

async def task_b_I_T_M():
    global x, Light, Fan, Start, End
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
                    await asleep_ms(2000)
                    dht_D3.measure()
                    oled.fill(0)
                    oled.text('Temp: {}C'.format(dht_D3.temperature()), 0, 0, 1)
                    oled.text('Humid: {}%'.format(dht_D3.humidity()), 0, 10, 1)
                    oled.text('Light:{}'.format('1' if Light else '0'), 0, 20, 1)
                    oled.text('Fan:{}'.format('1' if Fan else '0'), 64, 20, 1)
                    # oled.text('S: {}'.format(start_str), 0, 35, 1)
                    # oled.text('E: {}'.format(end_str), 0, 45, 1)
                    oled.show()
                    
                    # await ci_client.send_telemetry({
                    #     'temperature': dht_D3.temperature(),
                    #     'humidity': dht_D3.humidity(),
                    # })

                    # Gửi dữ liệu đến IoT Gateway
                    data = {
                        "counter": counter,
                        "temperature": dht_D3.temperature(),
                        "humidity": dht_D3.humidity(),
                        "light": Light,
                        "fan": Fan
                    }
                    sock.send(json.dumps(data).encode('utf-8'))

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

async def setup():
    global Light, Fan
    print('App started')
    oled.text('Initializing...', 0, 0, 1)
    oled.show()
    
    neopix.show(0, hex_to_rgb('#ff0000'))
    wifi.connect('Bonjour', 'hellosine')
    # await ci_client.connect()
    wifi = connect_wifi()
    
    neopix.show(0, hex_to_rgb('#00ff00'))
    oled.fill(0)
    oled.text('Connected!', 0, 0, 1)
    oled.show()
    Light = False
    Fan = False
    
    await request_shared_attributes(['sharedvalueLight', 'sharedvalueFan'], on_shared_attributes_response)
    
    # ci_client.subscribe_attribute('sharedvalueLight', on_sharevalueLight_attribute_update)
    # ci_client.set_rpc_request_handler('setValueLight', on_rpc_request_setValueLight)
    # ci_client.subscribe_attribute('sharedvalueFan', on_sharevalueFan_attribute_update)
    # ci_client.set_rpc_request_handler('setValueFan', on_rpc_request_setValueFan)
    
    create_task(task_b_I_T_M())
    # create_task(check_fan_schedule())

async def main():
    await setup()
    while True:
        await asleep_ms(100)

run_loop(main())