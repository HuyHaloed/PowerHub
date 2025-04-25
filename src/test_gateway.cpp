#include <WiFi.h>
#include <PubSubClient.h>
#include <SimpleDHT.h>

// WiFi & MQTT config
const char *ssid = "Bonjour";
const char *password = "hellosine";
const char *mqtt_server = "10.0.116.86";
const char *mqtt_topic = "esp32/data";
const char *mqtt_cmd_topic = "esp32/data/cmd";

// config pin
#define DHT_PIN GPIO_NUM_6
#define LIGHT_PIN GPIO_NUM_4          // Chân ADC cho quang trở (GPIO4 - ADC1_CH3)
#define FAN_PIN GPIO_NUM_47           // Chân điều khiển Fan
#define LIGHT_CONTROL_PIN GPIO_NUM_48 // Chân điều khiển Light

WiFiClient espClient;
PubSubClient client(espClient);
SimpleDHT11 dht(DHT_PIN);

// State variables
float temperature = 0;
float humidity = 0;
float power = 0; // Giả lập, thay bằng cảm biến thực tế nếu có
bool light_state = false;
bool fan_state = false;

void setup_wifi()
{
    delay(10);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {   
        Serial.print(".");
        delay(500);
    }
}

void callback(char *topic, byte *payload, unsigned int length)
{
    String msg;
    for (unsigned int i = 0; i < length; i++)
    {
        msg += (char)payload[i];
    }
    // Parse JSON command
    if (msg.indexOf("light") != -1)
    {
        if (msg.indexOf("on") != -1)
        {
            digitalWrite(LIGHT_PIN, HIGH);
            light_state = true;
            Serial.println("Light turned ON");
        }
        else if (msg.indexOf("off") != -1)
        {
            digitalWrite(LIGHT_PIN, LOW);
            light_state = false;
            Serial.println("Light turned OFF");
        }
    }
    if (msg.indexOf("fan") != -1)
    {
        if (msg.indexOf("on") != -1)
        {
            digitalWrite(FAN_PIN, HIGH);
            fan_state = true;
            Serial.println("Fan turned ON");
        }
        else if (msg.indexOf("off") != -1)
        {
            digitalWrite(FAN_PIN, LOW);
            fan_state = false;
            Serial.println("Fan turned OFF");
        }
    }
}

void reconnect()
{
    while (!client.connected())
    {
        if (client.connect("ESP32Client"))
        {
            client.subscribe(mqtt_cmd_topic);
        }
        else
        {
            delay(2000);
        }
    }
}

void setup()
{
    Serial.begin(115200);
    pinMode(FAN_PIN, OUTPUT);
    pinMode(LIGHT_CONTROL_PIN, OUTPUT);
    setup_wifi();
    client.setServer(mqtt_server, 1883);
    client.setCallback(callback);
}

void loop()
{
    if (!client.connected())
    {
        Serial.println("MQTT not connected, trying to connect...");
        reconnect();
    }
    client.loop();

    // Đọc cảm biến mỗi 5 giây
    static unsigned long lastSend = 0;
    if (millis() - lastSend > 5000)
    {
        lastSend = millis();
        // Đọc dữ liệu từ cảm biến DHT11
        float temperature = 0;
        float humidity = 0;

        int dht_err = dht.read2(&temperature, &humidity, NULL);

        // Giả lập power, thay bằng cảm biến thực tế nếu có
        power = random(10, 100) / 10.0;

        // Gửi dữ liệu lên MQTT
        String payload = "{";
        payload += "\"temperature\":" + String(temperature, 1) + ",";
        payload += "\"humidity\":" + String(humidity, 1) + ",";
        payload += "\"power\":" + String(power, 1) + ",";
        payload += "\"light\":" + String(light_state ? "true" : "false") + ",";
        payload += "\"fan\":" + String(fan_state ? "true" : "false");
        payload += "}";

        client.publish(mqtt_topic, payload.c_str());
    }
}