from ssd1306 import *
from wifi import *
from ci_device_mqtt import *
from machine import Pin
import dht
from pins import *

# Cập nhật trạng thái nút
async def UpdateState(x):
    global Light, Fan
    if x == 'Light':
        await ci_client.send_attributes({'sharevalueLight': Light})
    elif x == 'Fan':
        await ci_client.send_attributes({'sharevalueFan': Fan})

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

# Mô tả hàm này...
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

# Mô tả hàm này: lưu ý là chọn chân tín hiệu cho relay nên chọn chân thuần gpio
async def controlFan():
    global Light, Fan
    if Fan == False:
        pin_D13.write_digital(0)
    else:
        pin_D13.write_digital(1)

async def request_shared_attributes(keys, callback):
    """
    Yêu cầu giá trị shared attributes từ ThingsBoard.
    :param keys: Danh sách các key cần lấy (ví dụ: ['sharevalueLight', 'sharevalueFan'])
    :param callback: Hàm callback để xử lý kết quả trả về
    """
    await ci_client.request_attributes([], keys, callback)

async def on_shared_attributes_response(attributes, exception):
    """
    Callback xử lý kết quả trả về từ request shared attributes.
    """
    if exception:
        print("Error fetching shared attributes:", exception)
        return

    global Light, Fan

    # Lấy giá trị sharevalueLight nếu có
    if 'sharevalueLight' in attributes.get('shared', {}):
        Light = attributes['shared']['sharevalueLight']
        print("Updated Light from server:", Light)
        await controlLight()

    # Lấy giá trị sharevalueFan nếu có
    if 'sharevalueFan' in attributes.get('shared', {}):
        Fan = attributes['shared']['sharevalueFan']
        print("Updated Fan from server:", Fan)
        await controlFan()

x = None
Light = None
Fan = None
start = None
oled = SSD1306_I2C()
wifi = Wifi()
ci_client = CIDeviceMqttClient('Bonjour', 'hellosine', 'ZS9KjbmsPcXtniB8q9yP', 'app.coreiot.io', 1883)

dht_D3 = dht.DHT11(Pin(D3_PIN))
pin_D13 = Pins(D13_PIN)

async def task_b_I_T_M():
    global x, Light, Fan, start
    while True:
        await asleep_ms(2000)
        dht_D3.measure()
        oled.fill(0); oled.show()
        oled.text(str('sending...'), 1-1, 10-1, 1); oled.show()
        await ci_client.send_telemetry({'temperature':(dht_D3.temperature()),'humidity':(dht_D3.humidity())})
        oled.text(str('Temp:'), 1-1, 20-1, 1); oled.show()
        oled.text(str('Humid:'), 1-1, 30-1, 1); oled.show()
        oled.text(str((dht_D3.temperature())), 50-1, 20-1, 1); oled.show()
        oled.text(str((dht_D3.humidity())), 50-1, 30-1, 1); oled.show()
        oled.text(str(Light), 1-1, 40-1, 1); oled.show()
        oled.text(str(Fan), 50-1, 40-1, 1); oled.show()

async def setup():
    global x, Light, Fan, start
    print('App started')
    oled.text(str('hello'), 1-1, 1-1, 1); oled.show()
    neopix.show(0, hex_to_rgb('#ff0000'))
    # wifi.connect('Bonjour', 'hellosine')
    await ci_client.connect()
    neopix.show(0, hex_to_rgb('#00ff00'))
    oled.text(str('connected'), 1-1, 10-1, 1); oled.show()
    oled.text(str('device'), 1-1, 40-1, 1); oled.show()
    await asleep_ms(1000)
    oled.fill(0); oled.show()

    # Khởi tạo giá trị mặc định
    Light = False
    Fan = False

    # Yêu cầu giá trị shared attributes từ ThingsBoard
    await request_shared_attributes(['sharevalueLight', 'sharevalueFan'], on_shared_attributes_response)

    # Thiết lập các callback và RPC handlers
    ci_client.subscribe_attribute('sharevalueLight', on_sharevalueLight_attribute_update)
    ci_client.set_rpc_request_handler('setValueLight', on_rpc_request_setValueLight)
    ci_client.subscribe_attribute('sharevalueFan', on_sharevalueFan_attribute_update)
    ci_client.set_rpc_request_handler('setValueFan', on_rpc_request_setValueFan)

    # Bắt đầu task chính
    create_task(task_b_I_T_M())

async def main():
    await setup()
    while True:
        await asleep_ms(100)

run_loop(main())