#include <WiFi.h>
#include <SimpleDHT.h>
#include <PZEM004Tv30.h>
#include <HardwareSerial.h>
#include "AdafruitIO_WiFi.h"

#define DHT_PIN GPIO_NUM_6
#define LIGHT_PIN GPIO_NUM_4          // Chân ADC cho quang trở (GPIO4 - ADC1_CH3)
#define FAN_PIN GPIO_NUM_47           // Chân điều khiển Fan
#define LIGHT_CONTROL_PIN GPIO_NUM_48 // Chân điều khiển Light

// Chân RXD2 và TXD2 được định nghĩa cho Serial2 trên YoloUno
#define RXD2 38 // Chân 11
#define TXD2 21 // chân 10
#define PZEM_SERIAL Serial2

PZEM004Tv30 pzem(PZEM_SERIAL, RXD2, TXD2);

// Thông tin WiFi
#define WIFI_SSID "Bonjour"
#define WIFI_PASS "hellosine"
// const char *THINGSBOARD_SERVER = "10.0.122.240";

// Thông tin Adafruit IO
#define IO_USERNAME "Hellosine"
#define IO_KEY "aio_qGEl63Zg8c3Re0FfT6uqNStKyM7e"

// Tạo instance kết nối Adafruit IO
AdafruitIO_WiFi io(IO_USERNAME, IO_KEY, WIFI_SSID, WIFI_PASS);

// Khai báo hai feed temperature và humidity
AdafruitIO_Feed *temperature = io.feed("temperature");
AdafruitIO_Feed *humidity    = io.feed("humidity");
AdafruitIO_Feed *fan         = io.feed("Fan");
AdafruitIO_Feed *light       = io.feed("Light");


SimpleDHT11 dht(DHT_PIN);

struct SensorData
{
    float temperature;
    float humidity;
    float brightness;
};

// Khai báo các biến toàn cục
QueueHandle_t sensorQueue = NULL;     // Khởi tạo null để kiểm tra
SemaphoreHandle_t serialMutex = NULL; // Khởi tạo null để kiểm tra
TaskHandle_t Adafruit_Task_Handle = NULL;
TaskHandle_t Sensor_Task_Handle = NULL;

// Hàm xử lý khi có lệnh từ feed Fan
void handleFan(AdafruitIO_Data *data)
{
    String value = data->value();
    if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
    {
        Serial.print("Fan Command: ");
        Serial.println(value);
        xSemaphoreGive(serialMutex);
    }
    if (value == "ON" || value == "1")
    {
        digitalWrite(FAN_PIN, HIGH);
    }
    else
    {
        digitalWrite(FAN_PIN, LOW);
    }
}

// Hàm xử lý khi có lệnh từ feed Light
void handleLight(AdafruitIO_Data *data)
{
    String value = data->value();
    if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
    {
        Serial.print("Light Command: ");
        Serial.println(value);
        xSemaphoreGive(serialMutex);
    }

    if (value == "ON" || value == "1")
    {
        digitalWrite(LIGHT_PIN, HIGH);
    }
    else
    {
        digitalWrite(LIGHT_PIN, LOW);
    }
}

// Hàm kết nối và kiểm tra lại kết nối
void connectIO()
{
    // Kiểm tra kết nối WiFi
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.print("Connecting to WiFi...");
        WiFi.begin(WIFI_SSID, WIFI_PASS);
        while (WiFi.status() != WL_CONNECTED)
        {
            Serial.print(".");
            delay(500);
        }
        Serial.println();
        Serial.println("WiFi connected!");
    }

    // Kiểm tra kết nối Adafruit IO
    if (io.status() < AIO_CONNECTED)
    {
        Serial.print("Connecting to Adafruit IO...");
        io.connect();
        while (io.status() < AIO_CONNECTED)
        {
            Serial.print(".");
            delay(500);
        }
        Serial.println();
        Serial.println("Adafruit IO Connected!");
    }
}

void Adafruit_Task(void *pvParameters)
{
    while (true)
    {
        connectIO();
        io.run();

        SensorData data;
        if (sensorQueue && xQueueReceive(sensorQueue, &data, pdMS_TO_TICKS(1000)) == pdTRUE)
        {
            if (!isnan(data.temperature) && !isnan(data.humidity))
            {
                if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
                {
                    // Gửi dữ liệu lên Adafruit IO
                    temperature->save(data.temperature);
                    humidity->save(data.humidity);
                    // brightness->save(data.light_voltage);
                    Serial.printf("Sent -> Temp: %.2f°C, Humi: %.2f%%\n",
                                  data.temperature, data.humidity);
                    xSemaphoreGive(serialMutex);
                }
            }
        }
        else
        {
            if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
            {
                Serial.println("No data in queue");
                xSemaphoreGive(serialMutex);
            }
        }
        // Đợi 1s trước lần đọc tiếp theo
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

void Sensor_Task(void *pvParameters)
{
    // analogReadResolution(12);

    while (true)
    {
        float temperature = 0;
        float humidity = 0;

        // Đọc dữ liệu từ cảm biến DHT11
        int dht_err = dht.read2(&temperature, &humidity, NULL);

        // Đọc dữ liệu từ cảm biến quang trở (ADC);

        int raw_value = analogRead(LIGHT_PIN);
        // float voltage = analogReadMilliVolts(LIGHT_PIN) / 1000.0;
        float brightness = (float)raw_value / 4095.0 * 100; // Chuyển đổi giá trị ADC sang % (0-3.3V)

        //(dht_err == SimpleDHTErrSuccess && !isnan(temperature) && !isnan(humidity) && raw_value >= 0 && voltage >= 0 && current >= 0 && power >= 0 && energy >= 0)
        if (dht_err == SimpleDHTErrSuccess && !isnan(temperature) && !isnan(humidity))
        {
            if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
            {
                Serial.printf("Read Sensors -> Temp: %.2f°C, Humi: %.2f%%, Light: %.2f%%\n",
                              temperature, humidity, brightness);
                vTaskDelay(pdMS_TO_TICKS(100));
                xSemaphoreGive(serialMutex);
            }

            SensorData data = {temperature, humidity, brightness};

            // Gửi dữ liệu vào hàng đợi
            if (sensorQueue && xQueueSend(sensorQueue, &data, pdMS_TO_TICKS(1000)) != pdTRUE)
            {
                if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
                {
                    Serial.println("Queue full! Overwriting oldest data...");
                    vTaskDelay(pdMS_TO_TICKS(100));
                    xSemaphoreGive(serialMutex);
                }
                SensorData dummy;
                xQueueReceive(sensorQueue, &dummy, 0);
                xQueueSend(sensorQueue, &data, pdMS_TO_TICKS(1000));
            }
        }
        else
        {
            if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
            {
                Serial.println("Failed to read sensors");
                if (dht_err != SimpleDHTErrSuccess)
                    Serial.printf("DHT11 read failed, error code: %d\n", dht_err);
                vTaskDelay(pdMS_TO_TICKS(100));
                xSemaphoreGive(serialMutex);
            }
        }
        vTaskDelay(pdMS_TO_TICKS(10000));
    }
}

void setup()
{

    // start the serial connection
    Serial.begin(115200);
    Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);

    pinMode(FAN_PIN, OUTPUT);
    pinMode(LIGHT_CONTROL_PIN, OUTPUT);
    digitalWrite(FAN_PIN, LOW);
    digitalWrite(LIGHT_CONTROL_PIN, LOW);

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

    xTaskCreate(Sensor_Task, "SensorTask", 4096, NULL, 1, &Sensor_Task_Handle);
    xTaskCreate(Adafruit_Task, "TBTask", 4096, NULL, 1, &Adafruit_Task_Handle);
    // Đăng ký hàm callback khi có dữ liệu mới từ feed
    fan->onMessage(handleFan);
    light->onMessage(handleLight);
}

void loop()
{
    delay(1000);
}