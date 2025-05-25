#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <Arduino_MQTT_Client.h>
#include <Server_Side_RPC.h>
#include <Attribute_Request.h>
#include <Shared_Attribute_Update.h>
#include <ThingsBoard.h>
#include <SimpleDHT.h>
#include <PZEM004Tv30.h>
#include <HardwareSerial.h>
#include <OTA_Firmware_Update.h>
#include <Espressif_Updater.h>

#define ENCRYPTED false

constexpr char CURRENT_FIRMWARE_TITLE[] = "DA_TTNT";
constexpr char CURRENT_FIRMWARE_VERSION[] = "2.0.0";

// Maximum amount of retries we attempt to download each firmware chunck over MQTT
constexpr uint8_t FIRMWARE_FAILURE_RETRIES = 12U;

// Size of each firmware chunck downloaded over MQTT,
// increased packet size, might increase download speed
constexpr uint16_t FIRMWARE_PACKET_SIZE = 4096U;

#define DHT_PIN GPIO_NUM_6
#define LIGHT_PIN GPIO_NUM_4          // Chân ADC cho quang trở (GPIO4 - ADC1_CH3)
#define FAN_PIN GPIO_NUM_47           // Chân điều khiển Fan
#define LIGHT_CONTROL_PIN GPIO_NUM_48 // Chân điều khiển Light

// Chân RXD2 và TXD2 được định nghĩa cho Serial2 trên YoloUno
#define RXD2 38 // Chân 11
#define TXD2 21 // chân 10
#define PZEM_SERIAL Serial2

const char *ssid = "Bonjour";
const char *password = "hellosine";
const char *TOKEN = "ZS9KjbmsPcXtniB8q9yP";
const char *THINGSBOARD_SERVER = "app.coreiot.io";

// const char * TOKEN = "wX9hDkeN0TiumJZlr9Yv";
// const char * THINGSBOARD_SERVER = "mqtt.thingsboard.cloud";
#if ENCRYPTED
constexpr uint16_t THINGSBOARD_PORT = 8883U;
#else
constexpr uint16_t THINGSBOARD_PORT = 1883U;
#endif

constexpr uint16_t MAX_MESSAGE_SIZE = 512U;
constexpr size_t MAX_ATTRIBUTES = 2U;
constexpr uint64_t REQUEST_TIMEOUT_MICROSECONDS = 5000U * 1000U;
constexpr int16_t TELEMETRY_SEND_INTERVAL = 5000U; // 5 seconds for telemetry send
constexpr uint32_t OTA_CHECK_INTERVAL = 30000U;    // 30 seconds for OTA check
// Baud rate for the debugging serial connection
// If the Serial output is mangled, ensure to change the monitor speed accordingly to this variable
constexpr uint32_t SERIAL_DEBUG_BAUD = 115200U;

#if ENCRYPTED
// See https://comodosslstore.com/resources/what-is-a-root-ca-certificate-and-how-do-i-download-it/
// on how to get the root certificate of the server we want to communicate with,
// this is needed to establish a secure connection and changes depending on the website.
constexpr char ROOT_CERT[] = R"(-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgISA7sIek9ePbSxi4sNwoMPmxVbMA0GCSqGSIb3DQEBCwUA
MEoxCzAJBgNVBAYTAlVTMRMwEQYDVQQKEwpMZXQncyBFbmNyeXB0MR8wHQYDVQQL
ExZ3d3cubGV0c2VuY3J5cHQub3JnIENBMB4XDTIxMDYxMTAwMDAwMFoXDTQ5MTIz
MTIzNTk1OVowSjELMAkGA1UEBhMCVVMxEzARBgNVBAoTCkxldCdzIEVuY3J5cHQx
HzAdBgNVBAsTFnd3dy5sZXRzZW5jcnlwdC5vcmcgQ0EwggIiMA0GCSqGSIb3DQEB
AQUAA4ICDwAwggIKAoICAQDRaAXg9rNlf1jT+E0mP6lzB2HzdECVTxDCEgX45P2m
8AgCZdDFJ1Cg/T76p5ejpFeilYYWq4nUihhVytCw/7ybNL3NYR8TL3YguP6ErgD9
HzbX9xse9D/nl8CZ9F5hhBeUAbm7lQZozdLNZt9xf2LZfYgkSm1UcUZBiLuN+Xow
KEmMW1ttxMz1cT2n2dT7iIdtfWIfZkSTzx37PzC71u5yAPkRGdBpiYbNQ4PDn9Wz
Q5gYIZQ2rT+bf5kW2Zl60zZEDbPE6NGEUEsSxWhHt4QDAiV+c9dE76AqL2V9KoFe
IqlGk3EyN/Jj6GpN66L3AmJSIdvh4Q6lC/At5WeN9ZoYoJcE/VnKoJ/jbqXoF1TQ
3YJrOv3dM8VZz1KROGfSh1hwMZVuqm6oYsb5eq7N1pA8aXU5IzW+whs6AY3Dh2yn
VJ5bf+m/UXuBeZVKDEjkf0yzRl6Boq1C/Nbw1+kAUOIQ2ArWVSG7Uohgq20KiwKL
YHg8Z+eYq+KClgoLq8aThFsmDprD1cZC4FzZuY8g4S5mZbEHRmxRMggYAY9uFv/0
jc7CgG5b0mN9Mvtyg7M5QkW9ZPY0C29EJHokU9OYp9u9d1N3lgVFG1Vt5ghsXO5L
eE+ezD4K4QsvGSpd6iGnDoZOmWjz/EgthZfG+XxW4uC9z8hoDF0p7XjQEr/VyGo/
XwIDAQABo0IwQDAdBgNVHQ4EFgQUX7vPZzPiwXWqtnB1+zRW/jJKk6cwDgYDVR0P
AQH/BAQDAgEGMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggIBADl3
1LBDmRz/ZMG3XHV7uxK7kz2BLnE0UeWbDg8TVI7Bh2ZHZVTp9P9uYQn1elOYJbAW
VfM8o7tXLP3QQn6EOQdxTu1Muq2B+Z0nv+3ExME1OEaJpKzXlRf/TSNKb3vVvzWM
lcj/YQUVUc25s9ZgRAfFJ9kaFa3N1WVqF3W6U2RfdgiI+jRnaRLcE7xRUzGUPDAE
YDG84ONhWgIN7rFCQpLZrYQquKtNm3KQ8/2B4MXUPBR7+9yJbLUWfRdwZpCw9V0d
CJ/n3zvGc6HzjYj9Suh/cbS2bPOpNxu6tg5QwSRU1taz0dVUtwMFE9Ah65Qgm5Fl
rHkA0u2rpP8VjoIsC9WlHZLrjFYMYQWjVKoSnpOqaPjFPTgEhD51F2dxKbLTNWAM
tw+Zkg+6J5RszX3FdsU3/J3tUScacHeYzAu+coch41KkCSsRvd8jEMDPnKQAxHvd
5G1y3s4A7DSo6n2oEoagPptRpG+pxKoTVStILRmcRZkjFumBbeOe8SSpSnZL+Q4i
PbLq6aIsfls0FYKgzELQynRjV0Rg64j7PjYnrN1Z4YqWrJBLq+O3R4irWrYEEK+U
2IDWeS3PZxICATGgZSvOJa3fI8YfpQYAGrRarwhiOevMmTwazFs7gOBymKXqCXv7
VGTAJBslKp+LwZt32CzdhFdX8Sh9aXtcGkGp
-----END CERTIFICATE-----
)";
#endif

// Initialize underlying client, used to establish a connection
#if ENCRYPTED
WiFiClientSecure espClient;
#else
WiFiClient espClient;
#endif

Arduino_MQTT_Client mqttClient(espClient);

// Khởi tạo các API
Server_Side_RPC<3U, 5U> rpc;
Attribute_Request<2U, MAX_ATTRIBUTES> attr_request;
Shared_Attribute_Update<3U, MAX_ATTRIBUTES> shared_update;
OTA_Firmware_Update<> ota;

const std::array<IAPI_Implementation *, 4U> apis = {
    &rpc,
    &attr_request,
    &shared_update,
    &ota};

ThingsBoard tb(mqttClient, MAX_MESSAGE_SIZE, MAX_MESSAGE_SIZE, Default_Max_Stack_Size, apis);
Espressif_Updater<> updater;

SimpleDHT11 dht(DHT_PIN);
PZEM004Tv30 pzem(PZEM_SERIAL, RXD2, TXD2);

QueueHandle_t sensorQueue = NULL;     // Khởi tạo null để kiểm tra
SemaphoreHandle_t serialMutex = NULL; // Khởi tạo null để kiểm tra
TaskHandle_t ThingsBoard_Task_Handle = NULL;
TaskHandle_t Sensor_Task_Handle = NULL;

// Statuses for updating
bool currentFWSent = false;
bool updateRequestSent = false;
bool isUpdatingOTA = false;
bool isConnectingTB = false; // Xác nhận kiểm tra kết nối ThingsBoard

// Biến trạng thái
volatile bool fanState = false;
volatile bool lightState = false;

// Attribute names
constexpr const char Fan_STATE_ATTR[] = "sharedvalueFan";
constexpr const char Light_STATE_ATTR[] = "sharedvalueLight";

// Danh sách shared attributes để subscribe (nếu cần)
constexpr std::array<const char *, 2U> SHARED_ATTRIBUTES_LIST = {
    Fan_STATE_ATTR,
    Light_STATE_ATTR};

struct SensorData
{
  float temperature;
  float humidity;
  float brightness;
  float voltage;
  float current;
  float power;
  float energy;
};

// RPC callback cho setValueFan
void processSetValueFan(const JsonVariantConst &data, JsonDocument &response)
{
  fanState = data.as<bool>();
  digitalWrite(FAN_PIN, fanState ? HIGH : LOW);

  if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
  {
    Serial.printf("Received RPC setValueFan: %d\n", fanState);
    xSemaphoreGive(serialMutex);
  }

  // Cập nhật attribute sharedvalueFan lên ThingsBoard
  tb.sendAttributeData("sharedvalueFan", fanState);

  StaticJsonDocument<32> response_doc;
  response_doc["newFanState"] = fanState;
  response.set(response_doc);
}

// RPC callback cho setValueLight
void processSetValueLight(const JsonVariantConst &data, JsonDocument &response)
{
  lightState = data.as<bool>();
  digitalWrite(LIGHT_CONTROL_PIN, lightState ? HIGH : LOW);

  if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
  {
    Serial.printf("Received RPC setValueLight: %d\n", lightState);
    xSemaphoreGive(serialMutex);
  }

  // Cập nhật attribute sharedvalueLight lên ThingsBoard
  tb.sendAttributeData("sharedvalueLight", lightState);

  StaticJsonDocument<32> response_doc;
  response_doc["newLightState"] = lightState;
  response.set(response_doc);
}

// Đăng ký RPC callbacks
const std::array<RPC_Callback, 2U> rpcCallbacks = {
    RPC_Callback{"setValueFan", processSetValueFan},
    RPC_Callback{"setValueLight", processSetValueLight}};

// Callback xử lý shared attributes (nếu cần)
void processSharedAttributes(const JsonObjectConst &data)
{
  if (data.isNull())
  {
    if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
    {
      Serial.println("Received null shared attributes data");
      xSemaphoreGive(serialMutex);
    }
    return;
  }

  for (auto it = data.begin(); it != data.end(); ++it)
  {
    if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
    {
      Serial.print("Received attribute: ");
      Serial.print(it->key().c_str());
      Serial.print(" = ");
      if (it->value().is<bool>())
      {
        Serial.println(it->value().as<bool>() ? "true" : "false");
      }
      else
      {
        Serial.println("(not boolean)");
      }
      xSemaphoreGive(serialMutex);
    }

    if (strcmp(it->key().c_str(), "sharedvalueFan") == 0)
    {
      if (it->value().is<bool>())
      {
        fanState = it->value().as<bool>();
        digitalWrite(FAN_PIN, fanState ? HIGH : LOW);
      }
    }

    if (strcmp(it->key().c_str(), "sharedvalueLight") == 0)
    {
      if (it->value().is<bool>())
      {
        lightState = it->value().as<bool>();
        digitalWrite(LIGHT_CONTROL_PIN, lightState ? HIGH : LOW);
      }
    }
  }
  isConnectingTB = true; // Xác nhận kiểm tra kết nối ThingsBoard
}

// Callback khi request timeout
void requestTimedOut()
{
  if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
  {
    Serial.printf("Attribute request timed out after %llu microseconds\n", REQUEST_TIMEOUT_MICROSECONDS);
    xSemaphoreGive(serialMutex);
  }
}

const Shared_Attribute_Callback<MAX_ATTRIBUTES> attributes_callback(&processSharedAttributes, SHARED_ATTRIBUTES_LIST.cbegin(), SHARED_ATTRIBUTES_LIST.cend());
const Attribute_Request_Callback<MAX_ATTRIBUTES> attribute_shared_request_callback(&processSharedAttributes, REQUEST_TIMEOUT_MICROSECONDS, &requestTimedOut, SHARED_ATTRIBUTES_LIST);

void connectToWiFi()
{
  if (WiFi.status() == WL_CONNECTED)
    return;

  Serial.print("Connecting WiFi");
  WiFi.begin(ssid, password);
  int retryCount = 0;
  const int maxRetries = 20;
  while (WiFi.status() != WL_CONNECTED && retryCount < maxRetries)
  {
    Serial.print(".");
    vTaskDelay(pdMS_TO_TICKS(500));
    retryCount++;
  }
  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("\nWiFi Connected");
  }
  else
  {
    Serial.println("\nWiFi Connection Failed");
  }
}

bool connectToThingsBoard()
{
  if (tb.connected())
    return true;

  if (xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
  {
    Serial.println("Connecting to ThingsBoard...");
    xSemaphoreGive(serialMutex);
  }
  if (!tb.connect(THINGSBOARD_SERVER, TOKEN, THINGSBOARD_PORT))
  {
    Serial.println("ThingsBoard connect failed");
    return false;
  }

  if (!isConnectingTB)
  {
    // Đăng ký RPC callbacks
    if (!rpc.RPC_Subscribe(rpcCallbacks.cbegin(), rpcCallbacks.cend()))
    {
      Serial.println("Failed to subscribe for RPC");
      return false;
    }

    // Đăng ký callback và request attributes (nếu cần)
    if (!shared_update.Shared_Attributes_Subscribe(attributes_callback))
    {
      if (xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
      {
        Serial.println("Failed to subscribe for shared attributes");
        xSemaphoreGive(serialMutex);
      }
      return false;
    }
    if (!attr_request.Shared_Attributes_Request(attribute_shared_request_callback))
    {
      if (xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
      {
        Serial.println("Failed to request shared attributes");
        xSemaphoreGive(serialMutex);
      }
      return false;
    }
    if(xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      Serial.println("Subscribed to shared attributes and requested attributes successfully");
      xSemaphoreGive(serialMutex);
    }
  }
  return true;
}

void InitWiFi()
{
  Serial.println("Connecting to AP ...");
  // Attempting to establish a connection to the given WiFi network
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    // Delay 500ms until a connection has been successfully established
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected to AP");
#if ENCRYPTED
  espClient.setCACert(ROOT_CERT);
#endif
}

/// @brief Reconnects the WiFi uses InitWiFi if the connection has been removed
/// @return Returns true as soon as a connection has been established again
bool reconnect()
{
  // Check to ensure we aren't connected yet
  const wl_status_t status = WiFi.status();
  if (status == WL_CONNECTED)
  {
    return true;
  }

  // If we aren't establish a new connection to the given WiFi network
  InitWiFi();
  return true;
}

void update_starting_callback()
{
  if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
  {
    Serial.println("Update starting, stopping tasks...");
    xSemaphoreGive(serialMutex);
  }

  // Dừng các tác vụ không cần thiết
  vTaskSuspend(Sensor_Task_Handle);
  vTaskSuspend(ThingsBoard_Task_Handle);
  isUpdatingOTA = true; // Dừng gửi telemetry lên ThingsBoard

  // // Hủy đăng ký các thuộc tính và RPC
  // tb.Cleanup_Subscriptions();

  if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
  {
    Serial.println("Tasks suspended and attributes unsubscribed for OTA update");
    xSemaphoreGive(serialMutex);
  }
}

/// @brief End callback method that will be called as soon as the OTA firmware update, either finished successfully or failed.
/// Is meant to allow to either restart the device if the udpate was successfull or to restart any stopped services before the update started in the subscribed update_starting_callback
/// @param success Either true (update successful) or false (update failed)
void finished_callback(const bool &success)
{
  if (success)
  {
    Serial.println("OTA update successful, rebooting...");
    esp_restart();
  }
  else
  {
    Serial.println("OTA update failed, resuming tasks and resubscribing attributes...");
    // Tiếp tục các tác vụ nếu OTA thất bại
    vTaskResume(ThingsBoard_Task_Handle);
    vTaskResume(Sensor_Task_Handle);
    isUpdatingOTA = false; // Tiếp tục gửi telemetry lên ThingsBoar
  }
}

void progress_callback(const size_t &current, const size_t &total)
{
  if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
  {
    Serial.printf("Progress %.2f%%\n", static_cast<float>(current * 100U) / total);
    xSemaphoreGive(serialMutex);
  }
}


void ThingsBoard_Task(void *pvParameters)
{
  uint32_t previousTelemetrySend = 0;

  while (true)
  {
    connectToWiFi();
    if (!connectToThingsBoard())
    {
      vTaskDelay(pdMS_TO_TICKS(5000));
      if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
      {
        Serial.println("ThingsBoard disconnected, attempting reconnect...");
        xSemaphoreGive(serialMutex);
      }
      tb.disconnect();
      continue;
    }

    SensorData data;
    if (sensorQueue && xQueueReceive(sensorQueue, &data, pdMS_TO_TICKS(1000)) == pdTRUE)
    {
      if (tb.connected() && !isnan(data.temperature) && !isnan(data.humidity) && data.brightness >= 0)
      {
        if (millis() - previousTelemetrySend > TELEMETRY_SEND_INTERVAL)
        {
          if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
          {
            tb.sendTelemetryData("temperature", data.temperature);
            tb.sendTelemetryData("humidity", data.humidity);
            tb.sendTelemetryData("brightness", data.brightness);
            tb.sendTelemetryData("voltage", data.voltage);
            tb.sendTelemetryData("current", data.current);
            tb.sendTelemetryData("power", data.power);
            tb.sendTelemetryData("energy", data.energy);
            tb.sendTelemetryData("fanState", fanState);
            tb.sendTelemetryData("lightState", lightState);
            Serial.printf("Sent -> Temp: %.2f°C, Humi: %.2f%%, Light: %.2f%%, Voltage: %.2fV, Current: %.2fA, Power: %.2fW, Energy: %.2fWh, Fan: %d, Light: %d\n",
                          data.temperature, data.humidity, data.brightness, data.voltage, data.current, data.power, data.energy, fanState, lightState);
            xSemaphoreGive(serialMutex);
          }
          previousTelemetrySend = millis();
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

    if (tb.connected())
    {
      tb.loop(); // Chỉ gọi loop khi kết nối còn sống
    }
    else
    {
      Serial.println("ThingsBoard disconnected, attempting reconnect...");
      tb.disconnect();
    }
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

void OTA_Update_Task(void *pvParameters)
{
  uint32_t previousOTAcheck = millis();
  while (true)
  {
    if (!reconnect())
    {
      continue;
    }

    if (!tb.connected())
    {
      // Reconnect to the ThingsBoard server,
      // if a connection was disrupted or has not yet been established
      if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
      {
        Serial.printf("Connecting to: (%s) with token (%s)\n", THINGSBOARD_SERVER, TOKEN);
        xSemaphoreGive(serialMutex);
      }
      if (!tb.connect(THINGSBOARD_SERVER, TOKEN, THINGSBOARD_PORT) && isUpdatingOTA)
      {
        if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
        {
          Serial.println("Failed to connect");
          xSemaphoreGive(serialMutex);
        }
        continue;
      }
    }

    if (!currentFWSent)
    {
      currentFWSent = ota.Firmware_Send_Info(CURRENT_FIRMWARE_TITLE, CURRENT_FIRMWARE_VERSION);
      if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
      {
        Serial.println("Firmware info sent to ThingsBoard");
        xSemaphoreGive(serialMutex);
      }
    }

    if (!updateRequestSent)
    {
      if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
      {
        Serial.println("Firwmare Update...");
        xSemaphoreGive(serialMutex);
      }
      const OTA_Update_Callback callback(CURRENT_FIRMWARE_TITLE, CURRENT_FIRMWARE_VERSION, &updater, &finished_callback, &progress_callback, &update_starting_callback, FIRMWARE_FAILURE_RETRIES, FIRMWARE_PACKET_SIZE);
      // See https://thingsboard.io/docs/user-guide/ota-updates/
      // to understand how to create a new OTA pacakge and assign it to a device so it can download it.
      // Sending the request again after a successfull update will automatically send the UPDATED firmware state,
      // because the assigned firmware title and version on the cloud and the firmware version and title we booted into are the same.
      updateRequestSent = ota.Start_Firmware_Update(callback);
      if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
      {
        Serial.printf("updateRequestSent to ThingsBoard: %s", updateRequestSent ? "true" : "false");
        Serial.println();
        xSemaphoreGive(serialMutex);
      }
    }

    // OTA check every 30 seconds
    if (millis() - previousOTAcheck > OTA_CHECK_INTERVAL && !isUpdatingOTA)
    {
      if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
      {
        Serial.println("OTA check data...");
        xSemaphoreGive(serialMutex);
      }
      currentFWSent = false;
      updateRequestSent = false;
      previousOTAcheck = millis();
    }
    if (tb.connected())
    {
      tb.loop(); // Chỉ gọi loop khi kết nối còn sống, lấy sự kiện nhận được từ mqtt broker
    }
    else
    {
      if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
      {
        Serial.println("ThingsBoard disconnected, attempting reconnect...");
        xSemaphoreGive(serialMutex);
      }
      tb.disconnect();
      continue;
    }
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

    // Đọc dữ liệu từ PZEM004T
    float voltage = pzem.voltage();
    float current = pzem.current();
    float power = pzem.power();
    float energy = pzem.energy();
    //(dht_err == SimpleDHTErrSuccess && !isnan(temperature) && !isnan(humidity) && raw_value >= 0 && voltage >= 0 && current >= 0 && power >= 0 && energy >= 0)
    if (dht_err == SimpleDHTErrSuccess && !isnan(temperature) && !isnan(humidity))
    {
      if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
      {
        Serial.printf("Read Sensors -> Temp: %.2f°C, Humi: %.2f%%, Light: %.2f%%, Voltage: %.2fV, Current: %.2fA, Power: %.2fW, Energy: %.2fWh\n",
                      temperature, humidity, brightness, voltage, current, power, energy);
        vTaskDelay(pdMS_TO_TICKS(100));
        xSemaphoreGive(serialMutex);
      }

      SensorData data = {temperature, humidity, brightness, voltage, current, power, energy};

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
        if (raw_value < 0)
          Serial.println("Light sensor read failed");
        if (voltage < 0)
          Serial.println("Voltage read failed");
        if (current < 0)
          Serial.println("Current read failed");
        if (power < 0)
          Serial.println("Power read failed");
        if (energy < 0)
          Serial.println("Energy read failed");
        vTaskDelay(pdMS_TO_TICKS(100));
        xSemaphoreGive(serialMutex);
      }
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
  xTaskCreate(ThingsBoard_Task, "TBTask", 4096, NULL, 1, &ThingsBoard_Task_Handle);
  while (!isConnectingTB)
  {
    delay(1000); // Đợi cho đến khi hoàn thành khởi tạo với Thingsboard, sau đó tạo OTA_Update_Task để tránh xung đột về attribute request
  }
  Serial.println("Starting OTA Update Task...");
  xTaskCreate(OTA_Update_Task, "OTAUpdateTask", 4096, NULL, 1, NULL);
}

void loop()
{
  vTaskDelay(pdMS_TO_TICKS(1000));
}