# print("Hello Core IOT")
# import paho.mqtt.client as mqttclient   # version 1.6.1
# import time
# import json

# BROKER_ADDRESS = "app.coreiot.io"
# PORT = 1883
# ACCESS_TOKEN = "rsoMvGsRuM9iNbDZBZd3"
# ACCESS_USERNAME = "IOT_DEVICE_3"

# def subscribed(client, userdata, mid, granted_qos):
#     print("Subscribed...")


# def recv_message(client, userdata, message):
#     print("Received: ", message.payload.decode("utf-8"))
#     temp_data = {'value': True}
#     try:
#         jsonobj = json.loads(message.payload)
#         if jsonobj['method'] == "setValue":
#             temp_data['value'] = jsonobj['params']
#             client.publish('v1/devices/me/attributes', json.dumps(temp_data), 1)
#     except:
#         pass


# def connected(client, usedata, flags, rc):
#     if rc == 0:
#         print("Connected successfully!!")
#         client.subscribe("v1/devices/me/rpc/request/+")
#     else:
#         print("Connection is failed")


# client = mqttclient.Client("IOT_DEVICE_2")
# client.username_pw_set(ACCESS_TOKEN)

# client.on_connect = connected
# client.connect(BROKER_ADDRESS, 1883)
# client.loop_start()

# client.on_subscribe = subscribed
# client.on_message = recv_message

# temp = 49
# humi = 50
# light_intesity = 100
# counter = 0
# while True:
#     collect_data = {'temperature': temp, 'humidity': humi, 'light':light_intesity}
#     temp += 1
#     humi += 1
#     light_intesity += 1
#     client.publish('v1/devices/me/telemetry', json.dumps(collect_data), 1)
#     time.sleep(5)

import paho.mqtt.client as mqtt
import json

THINGSBOARD_HOST = "app.coreiot.io"
ACCESS_TOKEN = "aInZbDDLhqg9PaTWZUYr"
ATTRIBUTE_KEY = "sharedTime"
REQUEST_ID = 1  # Mã ID yêu cầu truy vấn

# Hàm xử lý khi nhận được phản hồi từ ThingsBoard
def on_message(client, userdata, msg):
    print(f"Received message: {msg.payload.decode()} on topic {msg.topic}")

# Tạo MQTT client và thiết lập thông tin đăng nhập
client = mqtt.Client()
client.username_pw_set(ACCESS_TOKEN)
client.on_message = on_message

# Kết nối đến ThingsBoard server
client.connect(THINGSBOARD_HOST, 1883, 60)

# Subscribe để nhận phản hồi từ ThingsBoard
client.subscribe("v1/devices/me/attributes/response/+")
print("Subscribed to response topic")

# Gửi yêu cầu lấy giá trị của `sharedTime`
request_payload = json.dumps({
    "id": REQUEST_ID,
    "method": "getAttributes",
    "params": {
        "server": [ATTRIBUTE_KEY]
    }
})

client.publish("v1/devices/me/attributes/request/{}".format(REQUEST_ID), request_payload)
print(f"Request sent: {request_payload}")

# Chạy vòng lặp để lắng nghe phản hồi
client.loop_forever()
