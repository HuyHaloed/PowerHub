#-------------------------------------------------------------------
# Mô-đun này sử dụng Ollama để phân tích ngữ nghĩa câu lệnh tiếng Việt
#  - Gửi câu hỏi từ người dùng tới Ollama API
#  - Nhận phản hồi JSON từ Ollama API
#  - Hành động với dữ liệu cảm biến và điều khiển thiết bị
#  - Có thể được mở rộng để điều khiển thiết bị thực tế
#  - Có thể được mở rộng để trả lời câu hỏi chung về hệ thống
#-------------------------------------------------------------------
import requests
import json
import os
from AIchatbot.mqttservice import get_temperature
from AIchatbot.mqttservice import get_humidity
from AIchatbot.mqttservice import get_energy_consumption
from AIchatbot.mqttservice import turn_on_fan, turn_off_fan, turn_on_light, turn_off_light

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
    return f"""You are an NLU module. Receive a English sentence, analyze it, and return a JSON object with 2 fields:
- device: the name of the device (one of {valid_devices}) or null
- action: one of {valid_actions} or null
If the user asks "temperature", the action is "query_temperature", and the device is "DHT".
If the user asks "humidity", the action is "query_humidity", and the device is "DHT".
If the user asks "power consumption this month", the action is "query_power", and the device is "PZEM".
If the command is to turn on/off the light/fan, the action is "on"/"off", and the device is "light"/"fan".
If the user asks about the system's capabilities, how to use the system, personal info or related to customer service, set action to "general_question" and device to null.
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

def load_guide():
    """
    Đọc file guide.txt và trả về nội dung dưới dạng dict.
    """
    guide_path = os.path.join(os.path.dirname(__file__), "guide.txt")
    if not os.path.exists(guide_path):
        return None
    with open(guide_path, "r", encoding="utf-8") as f:
        return json.load(f)

def find_guide_answer(user_text, guide_data):
    """
    Tìm kiếm nội dung phù hợp trong guide_data dựa trên user_text.
    Trả về câu trả lời phù hợp hoặc None nếu không tìm thấy.
    """
    if not guide_data:
        return None
    user_text_lower = user_text.lower()
    # Dò theo từng mục
    for key, items in guide_data.items():
        for item in items:
            # Nếu user_text chứa từ khóa của item hoặc ngược lại
            if any(word in user_text_lower for word in item.lower().split()):
                return item
    return None

def ask_again(user_text):
    """
    Send a prompt to Ollama, requesting an answer based on the content of guide.txt for the user's question.
    """
    guide_txt_path = os.path.join(os.path.dirname(__file__), "guide.txt")
    if os.path.exists(guide_txt_path):
        with open(guide_txt_path, "r", encoding="utf-8") as f:
            guide_content = f.read()
        prompt = (
            "Based on the following information about the system and user guide:\n"
            f"{guide_content}\n"
            f"Please provide a concise and accurate answer to the user's question: \"{user_text}\""
        )
        ollama_payload = {
            "model": "llama3.2",
            "messages": [
                {"role": "system", "content": "You are an assistant supporting users based on the system guide."},
                {"role": "user", "content": prompt}
            ],
            "stream": False
        }
        try:
            resp = requests.post(f"{OLLAMA_API}/api/chat", json=ollama_payload)
            resp.raise_for_status()
            data = resp.json()
            content = data["message"]["content"]
            return content.strip()
        except Exception as e:
            print(f"Error when querying Ollama: {e}")
            return "Unable to retrieve information from the system guide."
    else:
        return "Guide file guide.txt not found."

def control_device(device, action, user_text=None):
    """
    Hàm mẫu để điều khiển thiết bị hoặc trả lời câu hỏi dựa trên intent.
    Trả về phản hồi dạng chuỗi.
    """
    if action in ["on", "off"]:
        # Điều khiển thiết bị thực tế
        if device == "fan":
            if action == "on":
                turn_on_fan()
                return "Đã bật quạt."
            else:
                turn_off_fan()
                return "Đã tắt quạt."
        elif device == "light":
            if action == "on":
                turn_on_light()
                return "Đã bật đèn."
            else:
                turn_off_light()
                return "Đã tắt đèn."
        else:
            return f"→ Control {device=} {action=}"
    elif device == "DHT" and action == "query_temperature":
        temperature = get_temperature()
        return f"Temperature now is {temperature}°C." if temperature else "Unable to get temperature data."
    elif device == "DHT" and action == "query_humidity":
        humidity = get_humidity()
        return f"Humidity now is {humidity}%." if humidity else "Unable to get humidity data."
    elif device == "PZEM" and action == "query_power":
        power = get_energy_consumption()
        return f"Power this month is {power} kWh." if power else "Unable to get power data."
    elif action == "general_question":
        guide_data = load_guide()
        # answer = find_guide_answer(user_text or "", guide_data)
        if guide_data:
            print(ask_again(user_text or ""))
        else:
            print("The information you requested is not available. Please contact customer service for assistance.")
        return None
    else:
        print("Cannot control device or answer question.")
        return None

__all__ = ["parse_intent", "control_device", "load_guide", "find_guide_answer"]