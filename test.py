#-------------------------------------------------------------------
#  File để kiểm tra NLU với Ollama API
#  - Gửi câu hỏi từ người dùng tới Ollama API
#  - Nhận phản hồi JSON từ Ollama API
#  - Hành động với dữ liệu cảm biến và điều khiển thiết bị
#-------------------------------------------------------------------
import requests
import json

# 🔧 Thay đổi nếu bạn chạy Ollama trên port khác
OLLAMA_API = "http://localhost:11434"

# Danh sách thiết bị & hành động hợp lệ
valid_devices = [
    "light", 
    "fan", 
    "DHT",  # cảm biến nhiệt độ độ ẩm
    "PZEM"  # cảm biến điện năng
]
valid_actions = [
    "on", 
    "off", 
    "query_temperature", 
    "query_humidity", 
    "query_power",
    "general_question"  # Thêm loại hành động cho câu hỏi chung
]

def build_system_message():
    """
    Hệ thống sẽ mô tả nhiệm vụ NLU và schema JSON (được Ollama hỗ trợ).
    """
    return f"""You are an NLU module. Receive a Vietnamese sentence, analyze it, and return a JSON object with 2 fields:
- device: the name of the device (one of {valid_devices}) or null
- action: one of {valid_actions} or null
If the user asks "current temperature", the action is "query_temperature", and the device is "DHT".
If the user asks "current humidity", the action is "query_humidity", and the device is "DHT".
If the user asks "power consumption this month", the action is "query_power", and the device is "PZEM".
If the command is to turn on/off the light/fan, the action is "on"/"off", and the device is "light"/"fan".
If the user asks about the system's capabilities, how to use, or other general questions, set action to "general_question" and device to null.
If it cannot be determined, return null for that field."""

def parse_intent(user_text: str) -> dict:
    """
    Gửi yêu cầu tới Ollama /api/chat với JSON schema để trả về chính xác JSON.
    """
    schema = {
        "type": "object",
        "properties": {
            "device": {
                "type": ["string", "null"],
                "enum": valid_devices + [None]
            },
            "action": {
                "type": ["string", "null"],
                "enum": valid_actions + [None]
            }
        },
        "required": ["device", "action"]
    }

    payload = {
        "model": "llama3.2",
        "messages": [
            {"role": "system", "content": build_system_message()},
            {"role": "user",   "content": user_text}
        ],
        "format": schema,
        "stream": False
    }

    resp = requests.post(f"{OLLAMA_API}/api/chat", json=payload)
    resp.raise_for_status()
    data = resp.json()
    content = data["message"]["content"]
    intent = json.loads(content)
    return intent

# Ví dụ sử dụng
if __name__ == "__main__":
    # Giả sử bạn có các hàm lấy dữ liệu cảm biến và điều khiển thiết bị
    def control_device(device, action):
        if action in ["on", "off"]:
            print(f"→ Control {device=} {action=}")
            # TODO: call MQTT / HTTP / Serial ... ở đây
        elif device == "DHT" and action == "query_temperature":
            # TODO: lấy dữ liệu nhiệt độ thực tế
            print("Temperature now is 25°C.")
        elif device == "DHT" and action == "query_humidity":
            # TODO: lấy dữ liệu độ ẩm thực tế
            print("Humidity now is 50%.")
        elif device == "PZEM" and action == "query_power":
            # TODO: lấy dữ liệu điện năng tiêu thụ thực tế
            print("Power this month is 120 kWh.")
        elif action == "general_question":
            # Trả lời các câu hỏi chung về hệ thống
            print("I can help you control lights, fans, check temperature, humidity, and power consumption. You can ask: 'Turn on the light', 'What is the current temperature?', 'How much power was consumed this month?', etc.")
        else:
            print("Cannot control device or answer question.")

    while True:
        cmd = input("You says: ")
        intent = parse_intent(cmd)
        print("Parsed intent:", intent)
        if intent["action"] == "general_question":
            control_device(None, "general_question")
        elif intent["device"] and intent["action"]:
            control_device(intent["device"], intent["action"])
        else:
            print("Request could not be recognized")