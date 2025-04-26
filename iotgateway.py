import threading
import json
import paho.mqtt.client as mqtt
from main import parse_intent

class IoTGateway:
    def __init__(self, esp32_broker, esp32_topic, tb_broker, tb_access_token):
        self.esp32_broker = esp32_broker
        self.esp32_topic = esp32_topic
        self.tb_broker = tb_broker
        self.tb_access_token = tb_access_token
        # MQTT client for ESP32
        self.esp32_client = mqtt.Client()
        # # MQTT client for ThingsBoard
        # self.tb_client = mqtt.Client()
        # self.tb_client.username_pw_set(self.tb_access_token)
        # Dữ liệu cảm biến và trạng thái thiết bị
        self.temperature = None
        self.humidity = None
        self.power = None
        self.light_state = None
        self.fan_state = None
        # Luồng chatbot
        self.chatbot_thread = threading.Thread(target=self.chatbot_loop, daemon=True)

    def start(self):
        self.esp32_client.on_connect = self.on_esp32_connect
        self.esp32_client.on_message = self.on_esp32_message
        self.esp32_client.connect(self.esp32_broker, 1883, 60)
        # self.tb_client.on_connect = self.on_tb_connect
        # self.tb_client.on_message = self.on_tb_message
        # self.tb_client.connect(self.tb_broker, 1883, 60)
        self.esp32_client.loop_start()
        # self.tb_client.loop_start()
        self.chatbot_thread.start()

    def on_esp32_connect(self, client, userdata, flags, rc):
        print("Connected to ESP32 MQTT broker")
        client.subscribe(self.esp32_topic)

    def on_esp32_message(self, client, userdata, msg):
        def worker():
            print(f"Received from ESP32: {msg.payload}")
            try:
                data = json.loads(msg.payload.decode())
                # Cập nhật dữ liệu cảm biến và trạng thái thiết bị
                if 'temperature' in data:
                    self.temperature = data['temperature']
                if 'humidity' in data:
                    self.humidity = data['humidity']
                if 'power' in data:
                    self.power = data['power']
                if 'light' in data:
                    self.light_state = data['light']
                if 'fan' in data:
                    self.fan_state = data['fan']
                # self.send_to_thingsboard(data)
            except Exception as e:
                print(f"Error parsing ESP32 data: {e}")
        threading.Thread(target=worker).start()

    # def on_tb_connect(self, client, userdata, flags, rc):
    #     print("Connected to ThingsBoard Cloud")
    #     client.subscribe("v1/devices/me/rpc/request/+")

    # def on_tb_message(self, client, userdata, msg):
    #     def worker():
    #         print(f"Received RPC from TB: {msg.payload}")
    #         try:
    #             rpc = json.loads(msg.payload.decode())
    #             self.handle_rpc(rpc)
    #         except Exception as e:
    #             print(f"Error parsing RPC: {e}")
    #     threading.Thread(target=worker).start()

    # def handle_rpc(self, rpc):
    #     try:
    #         command = json.dumps(rpc)
    #         self.esp32_client.publish(self.esp32_topic + "/cmd", command)
    #         print(f"Sent command to ESP32: {command}")
    #     except Exception as e:
    #         print(f"Error sending command to ESP32: {e}")

    # def send_to_thingsboard(self, data):
    #     try:
    #         self.tb_client.publish("v1/devices/me/telemetry", json.dumps(data))
    #         print(f"Sent telemetry to TB: {data}")
    #     except Exception as e:
    #         print(f"Error sending telemetry: {e}")

    def chatbot_loop(self):
        while True:
            user_text = input("You: ")
            intent = parse_intent(user_text)
            device = intent.get("device")
            action = intent.get("action")
            if action == "general_question":
                print("I can help you control lights, fans, check temperature, humidity, and power consumption. You can ask: 'Turn on the light', 'What is the current temperature?', 'How much power was consumed this month?', ...")
            elif device == "DHT" and action == "query_temperature":
                if self.temperature is not None:
                    print(f"The current temperature is {self.temperature}°C.")
                else:
                    print("No temperature data available.")
            elif device == "DHT" and action == "query_humidity":
                if self.humidity is not None:
                    print(f"The current humidity is {self.humidity}%.")
                else:
                    print("No humidity data available.")
            elif device == "PZEM" and action == "query_power":
                if self.power is not None:
                    print(f"The power consumption this month is {self.power} kWh.")
                else:
                    print("No power consumption data available.")
            elif device == "light" and action in ["on", "off"]:
                self.esp32_client.publish(self.esp32_topic + "/cmd", json.dumps({"device": "light", "action": action}))
                print(f"Sent command to turn {action} the light.")
            elif device == "fan" and action in ["on", "off"]:
                self.esp32_client.publish(self.esp32_topic + "/cmd", json.dumps({"device": "fan", "action": action}))
                print(f"Sent command to turn {action} the fan.")
            else:
                print("Could not recognize the request or device.")

    def stop(self):
        self.esp32_client.loop_stop()
        # self.tb_client.loop_stop()
        self.esp32_client.disconnect()
        # self.tb_client.disconnect()

__all__ = ["IoTGateway"]