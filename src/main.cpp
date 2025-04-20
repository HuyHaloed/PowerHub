#include <WiFi.h>
#include <Wire.h>
#include <Arduino_MQTT_Client.h>
#include <Server_Side_RPC.h>
#include <Attribute_Request.h>
#include <Shared_Attribute_Update.h>
#include <ThingsBoard.h>
#include <SimpleDHT.h>
#include <PZEM004Tv30.h>
#include <HardwareSerial.h>


#define DHT_PIN GPIO_NUM_6
#define LIGHT_PIN GPIO_NUM_4  // Chân ADC cho quang trở (GPIO4 - ADC1_CH3)
#define FAN_PIN GPIO_NUM_47   // Chân điều khiển Fan
#define LIGHT_CONTROL_PIN GPIO_NUM_48  // Chân điều khiển Light

// Chân RXD2 và TXD2 được định nghĩa cho Serial2 trên YoloUno
#define RXD2 38 //Chân 11
#define TXD2 21 //chân 10
#define PZEM_SERIAL Serial2

PZEM004Tv30 pzem(PZEM_SERIAL, RXD2, TXD2);

const char* ssid = "Bonjour";
const char* password = "hellosine";
const char* TOKEN = "ZS9KjbmsPcXtniB8q9yP";
const char* THINGSBOARD_SERVER = "app.coreiot.io";
// const char * TOKEN = "wX9hDkeN0TiumJZlr9Yv";
// const char * THINGSBOARD_SERVER = "mqtt.thingsboard.cloud";
const uint16_t THINGSBOARD_PORT = 1883;

constexpr uint16_t MAX_MESSAGE_SIZE = 128U;
constexpr size_t MAX_ATTRIBUTES = 2U;
constexpr uint64_t REQUEST_TIMEOUT_MICROSECONDS = 5000U * 1000U;
constexpr int16_t TELEMETRY_SEND_INTERVAL = 5000U;

WiFiClient espClient;
Arduino_MQTT_Client mqttClient(espClient);

// Khởi tạo các API
Server_Side_RPC<3U, 5U> rpc;
Attribute_Request<2U, MAX_ATTRIBUTES> attr_request;
Shared_Attribute_Update<3U, MAX_ATTRIBUTES> shared_update;

const std::array<IAPI_Implementation*, 3U> apis = {
  &rpc,
  &attr_request,
  &shared_update
};

ThingsBoard tb(mqttClient, MAX_MESSAGE_SIZE, MAX_MESSAGE_SIZE, Default_Max_Stack_Size, apis);

SimpleDHT11 dht(DHT_PIN);

QueueHandle_t sensorQueue = NULL; // Khởi tạo null để kiểm tra
SemaphoreHandle_t serialMutex = NULL; // Khởi tạo null để kiểm tra

// Biến trạng thái
volatile bool fanState = false;
volatile bool lightState = false;

// Attribute names
constexpr const char Fan_STATE_ATTR[] = "sharedvalueFan";
constexpr const char Light_STATE_ATTR[] = "sharedvalueLight";


// Danh sách shared attributes để subscribe (nếu cần)
constexpr std::array<const char *, 2U> SHARED_ATTRIBUTES_LIST = {
  Fan_STATE_ATTR,
  Light_STATE_ATTR
};

struct SensorData {
  float temperature;
  float humidity;
  float light_voltage;
  float voltage;
  float current;
  float power;
  float energy;
};

// RPC callback cho setValueFan
void processSetValueFan(const JsonVariantConst &data, JsonDocument &response) {
  fanState = data.as<bool>();
  digitalWrite(FAN_PIN, fanState ? HIGH : LOW);
  
  if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
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
void processSetValueLight(const JsonVariantConst &data, JsonDocument &response) {
  lightState = data.as<bool>();
  digitalWrite(LIGHT_CONTROL_PIN, lightState ? HIGH : LOW);
  
  if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
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
  RPC_Callback{ "setValueFan", processSetValueFan },
  RPC_Callback{ "setValueLight", processSetValueLight }
};

// Callback xử lý shared attributes (nếu cần)
void processSharedAttributes(const JsonObjectConst &data) {
  if (data.isNull()) {
    if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      Serial.println("Received null shared attributes data");
      xSemaphoreGive(serialMutex);
    }
    return;
  }

  for (auto it = data.begin(); it != data.end(); ++it) {
    if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      Serial.print("Received attribute: ");
      Serial.print(it->key().c_str());
      Serial.print(" = ");
      if (it->value().is<bool>()) {
        Serial.println(it->value().as<bool>() ? "true" : "false");
      } else {
        Serial.println("(not boolean)");
      }
      xSemaphoreGive(serialMutex);
    }
    
    if (strcmp(it->key().c_str(), "sharedvalueFan") == 0) {
      if (it->value().is<bool>()) {
        fanState = it->value().as<bool>();
        digitalWrite(FAN_PIN, fanState ? HIGH : LOW);
      }
    }
    
    if (strcmp(it->key().c_str(), "sharedvalueLight") == 0) {
      if (it->value().is<bool>()) {
        lightState = it->value().as<bool>();
        digitalWrite(LIGHT_CONTROL_PIN, lightState ? HIGH : LOW);
      }
    }
  }
}

// Callback khi request timeout
void requestTimedOut() {
  if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
    Serial.printf("Attribute request timed out after %llu microseconds\n", REQUEST_TIMEOUT_MICROSECONDS);
    xSemaphoreGive(serialMutex);
  }
}

const Shared_Attribute_Callback<MAX_ATTRIBUTES> attributes_callback(&processSharedAttributes, SHARED_ATTRIBUTES_LIST.cbegin(), SHARED_ATTRIBUTES_LIST.cend());
const Attribute_Request_Callback<MAX_ATTRIBUTES> attribute_shared_request_callback(&processSharedAttributes, REQUEST_TIMEOUT_MICROSECONDS, &requestTimedOut, SHARED_ATTRIBUTES_LIST);

void connectToWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Connecting WiFi");
  WiFi.begin(ssid, password);
  int retryCount = 0;
  const int maxRetries = 20;
  while (WiFi.status() != WL_CONNECTED && retryCount < maxRetries) {
    Serial.print(".");
    vTaskDelay(pdMS_TO_TICKS(500));
    retryCount++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected");
  } else {
    Serial.println("\nWiFi Connection Failed");
  }
}

bool connectToThingsBoard() {
  if (tb.connected()) return true;

  if(xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
    Serial.println("Connecting to ThingsBoard...");
    xSemaphoreGive(serialMutex);
  }
  if (!tb.connect(THINGSBOARD_SERVER, TOKEN, THINGSBOARD_PORT)) {
    Serial.println("ThingsBoard connect failed");
    return false;
  }
  
  // Đăng ký RPC callbacks
  if (!rpc.RPC_Subscribe(rpcCallbacks.cbegin(), rpcCallbacks.cend())) {
    Serial.println("Failed to subscribe for RPC");
    return false;
  }
  
  // Đăng ký callback và request attributes (nếu cần)
  if (!shared_update.Shared_Attributes_Subscribe(attributes_callback)) {
    if(xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      Serial.println("Failed to subscribe for shared attributes");
      xSemaphoreGive(serialMutex);
    }
    return false;
  }
  if (!attr_request.Shared_Attributes_Request(attribute_shared_request_callback)) {
    if(xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      Serial.println("Failed to request shared attributes");
      xSemaphoreGive(serialMutex);
    }
    return false;
  }
  // if(xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
  //   Serial.println("Subscribed to shared attributes and requested attributes successfully");
  //   xSemaphoreGive(serialMutex);
  // }
  return true;
}

void ThingsBoard_Task(void *pvParameters) {
  uint32_t previousTelemetrySend = 0;
  
  while (true) {
    connectToWiFi();
    if (!connectToThingsBoard()) {
      vTaskDelay(pdMS_TO_TICKS(5000));
      continue;
    }

    SensorData data;
    if (sensorQueue && xQueueReceive(sensorQueue, &data, pdMS_TO_TICKS(1000)) == pdTRUE) {
      if (tb.connected() && !isnan(data.temperature) && !isnan(data.humidity) && data.light_voltage >= 0) {
        if (millis() - previousTelemetrySend > TELEMETRY_SEND_INTERVAL) {
          if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
            tb.sendTelemetryData("temperature", data.temperature);
            tb.sendTelemetryData("humidity", data.humidity);
            tb.sendTelemetryData("brightness", data.light_voltage);
            tb.sendTelemetryData("voltage", data.voltage);
            tb.sendTelemetryData("current", data.current);
            tb.sendTelemetryData("power", data.power);
            tb.sendTelemetryData("energy", data.energy);
            tb.sendTelemetryData("fanState", fanState);
            tb.sendTelemetryData("lightState", lightState);
            Serial.printf("Sent -> Temp: %.2f°C, Humi: %.2f%%, Light: %.2f%%, Voltage: %.2fV, Current: %.2fA, Power: %.2fW, Energy: %.2fWh, Fan: %d, Light: %d\n", 
                          data.temperature, data.humidity, data.light_voltage, data.voltage, data.current, data.power, data.energy, fanState, lightState);
            xSemaphoreGive(serialMutex);
          }
          previousTelemetrySend = millis();
        }
      }
    } else {
      if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
        Serial.println("No data in queue");
        xSemaphoreGive(serialMutex);
      }
    }
    
    if (tb.connected()) {
      tb.loop(); // Chỉ gọi loop khi kết nối còn sống
    } else {
      Serial.println("ThingsBoard disconnected, attempting reconnect...");
      tb.disconnect();
    }
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}
void Sensor_Task(void *pvParameters) {
  analogReadResolution(12);
  
  while (true) {
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

    if (dht_err == SimpleDHTErrSuccess && !isnan(temperature) && !isnan(humidity) && raw_value >= 0 && voltage >= 0 && current >= 0 && power >= 0 && energy >= 0) {
      if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
        Serial.printf("Read Sensors -> Temp: %.2f°C, Humi: %.2f%%, Light: %.2f%%, Voltage: %.2fV, Current: %.2fA, Power: %.2fW, Energy: %.2fWh\n", 
                      temperature, humidity, brightness, voltage, current, power, energy);
        vTaskDelay(pdMS_TO_TICKS(100));
        xSemaphoreGive(serialMutex);
      }

      SensorData data = {temperature, humidity, brightness, voltage, current, power, energy};
      // Gửi dữ liệu vào hàng đợi
      if (sensorQueue && xQueueSend(sensorQueue, &data, pdMS_TO_TICKS(1000)) != pdTRUE) {
        if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
          Serial.println("Queue full! Overwriting oldest data...");
          vTaskDelay(pdMS_TO_TICKS(100));
          xSemaphoreGive(serialMutex);
        }
        SensorData dummy;
        xQueueReceive(sensorQueue, &dummy, 0);
        xQueueSend(sensorQueue, &data, pdMS_TO_TICKS(1000));
      }
    } else {
      if (serialMutex && xSemaphoreTake(serialMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
        Serial.println("Failed to read sensors");
        if (dht_err != SimpleDHTErrSuccess) Serial.printf("DHT11 read failed, error code: %d\n", dht_err);
        if (raw_value < 0) Serial.println("Light sensor read failed");
        if (voltage < 0) Serial.println("Voltage read failed");
        if (current < 0) Serial.println("Current read failed");
        if (power < 0) Serial.println("Power read failed");
        if (energy < 0) Serial.println("Energy read failed");
        vTaskDelay(pdMS_TO_TICKS(100));
        xSemaphoreGive(serialMutex);
      }
    }
    vTaskDelay(pdMS_TO_TICKS(5000));
  }
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);

  pinMode(FAN_PIN, OUTPUT);
  pinMode(LIGHT_CONTROL_PIN, OUTPUT);
  digitalWrite(FAN_PIN, LOW);
  digitalWrite(LIGHT_CONTROL_PIN, LOW);

  sensorQueue = xQueueCreate(10, sizeof(SensorData));
  if (sensorQueue == NULL) {
    Serial.println("Failed to create sensorQueue");
    while (true);
  }

  serialMutex = xSemaphoreCreateMutex();
  if (serialMutex == NULL) {
    Serial.println("Failed to create serialMutex");
    while (true);
  }

  xTaskCreatePinnedToCore(ThingsBoard_Task, "TBTask", 8192, NULL, 2, NULL, 1); // Core 1
  xTaskCreatePinnedToCore(Sensor_Task, "SensorTask", 4096, NULL, 1, NULL, 0);  // Core 0
}

void loop() {
  vTaskDelay(pdMS_TO_TICKS(1000));
}