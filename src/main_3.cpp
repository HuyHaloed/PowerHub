#include <WiFi.h>
#include <PubSubClient.h>
#include <SimpleDHT.h>
#include <PZEM004Tv30.h>
#include <WiFi.h>
#include <Wire.h>
#include <Arduino_MQTT_Client.h>
#include <Shared_Attribute_Update.h>
#include <SimpleDHT.h>
#include <PZEM004Tv30.h>
#include <HardwareSerial.h>

#define DHT_PIN GPIO_NUM_6
#define LIGHT_PIN GPIO_NUM_4
#define FAN_PIN GPIO_NUM_47
#define LIGHT_CONTROL_PIN GPIO_NUM_48
#define RXD2 38
#define TXD2 21
#define PZEM_SERIAL Serial2

PZEM004Tv30 pzem(PZEM_SERIAL, RXD2, TXD2);
SimpleDHT11 dht(DHT_PIN);

const char *ssid = "B1908";
const char *password = "AA123456aa";
const char *mqttServer = "192.168.1.9";
const int mqttPort = 1883;
const char *mqttClientId = "e8d28e2a-1f68-4f20-8a7e-c761a0c43ec8";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

volatile bool fanState = false;
volatile bool lightState = false;

QueueHandle_t sensorQueue = NULL;     // Khởi tạo null để kiểm tra
SemaphoreHandle_t serialMutex = NULL; // Khởi tạo null để kiểm tra

struct SensorData
{
    float temperature;
    float humidity;
    float light_voltage;
    float voltage;
    float current;
    float power;
    float energy;
};

void setupWiFi()
{
    Serial.print("Connecting to WiFi");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
    {
        Serial.println("\nWiFi connected");
        Serial.print("IP address: ");
        Serial.println(WiFi.localIP());
        xSemaphoreGive(serialMutex);
    }
}

void mqttCallback(char *topic, byte *payload, unsigned int length)
{
    String message;
    for (int i = 0; i < length; i++)
    {
        message += (char)payload[i];
    }

    if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
    {
        Serial.printf("Received [%s]: %s\n", topic, message.c_str());
        xSemaphoreGive(serialMutex);
    }

    if (String(topic) == "devices/e8d28e2a-1f68-4f20-8a7e-c761a0c43ec8/fan/set")
    {
        fanState = message == "true";
        digitalWrite(FAN_PIN, fanState ? HIGH : LOW);
        mqttClient.publish("devices/e8d28e2a-1f68-4f20-8a7e-c761a0c43ec8/fan/state", fanState ? "true" : "false");
    }
    else if (String(topic) == "devices/e8d28e2a-1f68-4f20-8a7e-c761a0c43ec8/light/set")
    {
        lightState = message == "true";
        digitalWrite(LIGHT_CONTROL_PIN, lightState ? HIGH : LOW);
        mqttClient.publish("devices/e8d28e2a-1f68-4f20-8a7e-c761a0c43ec8/light/state", lightState ? "true" : "false");
    }
}

void reconnect()
{
    while (!mqttClient.connected())
    {
        if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
        {
            Serial.print("Attempting MQTT connection...");
            xSemaphoreGive(serialMutex);
        }
        if (mqttClient.connect(mqttClientId))
        {
            if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
            {
                Serial.println("connected");
                xSemaphoreGive(serialMutex);
            }
            mqttClient.subscribe("devices/e8d28e2a-1f68-4f20-8a7e-c761a0c43ec8/fan/set");
            mqttClient.subscribe("devices/e8d28e2a-1f68-4f20-8a7e-c761a0c43ec8/light/set");
        }
        else
        {
            if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
            {
                Serial.print("failed, rc=");
                Serial.print(mqttClient.state());
                Serial.println(" try again in 5 seconds");
                xSemaphoreGive(serialMutex);
            }
            // Wait 5 seconds before retrying
            delay(5000);
        }
    }
}

void Server_task(void *pvParameters)
{
    while (true)
    {
        if (!mqttClient.connected())
        {
            reconnect();
        }
        mqttClient.loop();
    
        float temperature = 0, humidity = 0;
        dht.read2(&temperature, &humidity, NULL);
    
        int light_raw = analogRead(LIGHT_PIN);
        float brightness = light_raw / 4095.0 * 100.0;
    
        float voltage = pzem.voltage();
        float current = pzem.current();
        float power = pzem.power();
        float energy = pzem.energy();
    
        String json = "{";
        json += "\"temperature\":" + String(temperature, 2) + ",";
        json += "\"humidity\":" + String(humidity, 2) + ",";
        json += "\"brightness\":" + String(brightness, 2) + ",";
        json += "\"voltage\":" + String(voltage, 2) + ",";
        json += "\"current\":" + String(current, 2) + ",";
        json += "\"power\":" + String(power, 2) + ",";
        json += "\"energy\":" + String(energy, 2) + ",";
        json += "\"fanState\":" + String(fanState ? "true" : "false") + ",";
        json += "\"lightState\":" + String(lightState ? "true" : "false");
        json += "}";
    
        mqttClient.publish("devices/e8d28e2a-1f68-4f20-8a7e-c761a0c43ec8/telemetry", json.c_str());
        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}

void sensorTask(void *pvParameters)
{
    while (true)
    {
        float temperature = 0, humidity = 0;
        dht.read2(&temperature, &humidity, NULL);

        int light_raw = analogRead(LIGHT_PIN);
        float brightness = light_raw / 4095.0 * 100.0;

        float voltage = pzem.voltage();
        float current = pzem.current();
        float power = pzem.power();
        float energy = pzem.energy();

        SensorData data = {temperature, humidity, brightness, voltage, current, power, energy};
        if (sensorQueue && xQueueSend(sensorQueue, &data, pdMS_TO_TICKS(1000)) != pdTRUE)
        {
            Serial.println("Queue full! Overwriting oldest data...");
            SensorData dummy;
            xQueueReceive(sensorQueue, &dummy, 0);
            xQueueSend(sensorQueue, &data, pdMS_TO_TICKS(1000));
        }
        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}

void setup()
{
    Serial.begin(115200);
    Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);
    pinMode(FAN_PIN, OUTPUT);
    pinMode(LIGHT_CONTROL_PIN, OUTPUT);
    digitalWrite(FAN_PIN, LOW);
    digitalWrite(LIGHT_CONTROL_PIN, LOW);

    setupWiFi();
    mqttClient.setServer(mqttServer, mqttPort);
    mqttClient.setCallback(mqttCallback);

    sensorQueue = xQueueCreate(10, sizeof(SensorData));
    if (sensorQueue == NULL)
    {
        Serial.println("Failed to create sensorQueue");
        while (true)
            ;
    }

    serialMutex = xSemaphoreCreateMutex();
    if (serialMutex == NULL)
    {
        Serial.println("Failed to create serialMutex");
        while (true)
            ;
    }

    xTaskCreatePinnedToCore(Server_task, "TBTask", 8192, NULL, 2, NULL, 1); // Core 1
    xTaskCreatePinnedToCore(sensorTask, "SensorTask", 4096, NULL, 1, NULL, 0);  // Core 0
}

void loop()
{
    delay(5000);
}