import paho.mqtt.client as mqtt
import asyncio
import aioodbc

# Cấu hình MQTT Broker của CoreIoT
MQTT_BROKER = "broker.hivemq.com"  # Hoặc broker của CoreIoT
MQTT_TOPIC = "coreiot/sensor"

# Cấu hình Azure SQL Database
SQL_SERVER = "iot-assignment.database.windows.net"
DATABASE = "iot-device"
USERNAME = "admin-iot"
PASSWORD = "Fqvqx@1311"
DRIVER = "ODBC Driver 17 for SQL Server"

# Hàm kết nối SQL
async def insert_data(device_id, temperature, humidity):
    dsn = f"DRIVER={DRIVER};SERVER={SQL_SERVER};DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD}"
    
    async with aioodbc.create_pool(dsn=dsn) as pool:
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "INSERT INTO SensorData (device_id, temperature, humidity) VALUES (?, ?, ?)",
                    (device_id, temperature, humidity)
                )

# Hàm xử lý khi nhận dữ liệu từ MQTT
def on_message(client, userdata, msg):
    payload = msg.payload.decode("utf-8")
    print("Nhận dữ liệu:", payload)
    
    # Giả sử dữ liệu MQTT có dạng: "YoloUno,25.5,60"
    device_id, temp, hum = payload.split(",")
    asyncio.run(insert_data(device_id, float(temp), float(hum)))

# Kết nối MQTT
client = mqtt.Client()
client.on_message = on_message
client.connect(MQTT_BROKER, 1883, 60)
client.subscribe(MQTT_TOPIC)
client.loop_forever()
