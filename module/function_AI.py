import os
import json
import re
from module.mqttservice_ada import get_temperature, get_humidity
from module.LocalAI_API import call_ollama_chat, ask_ollama_with_guide

valid_devices = [
    "DHT",
]
valid_actions = [
    "query_temperature",
    "query_humidity",
    "general_question"
]

def build_system_message():
    return f"""You are an NLU module. Receive a English sentence, analyze it, and return a JSON object with 2 fields:
- device: the name of the device (one of {valid_devices}) or null
- action: one of {valid_actions} or null
If the user asks "temperature", the action is "query_temperature", and the device is "DHT".
If the user asks "humidity", the action is "query_humidity", and the device is "DHT".
If the user asks about the system's capabilities, how to use the system, personal info or related to customer service, set action to "general_question" and device to null.
If it cannot be determined, return null for that field."""

def parse_intent(user_text: str) -> dict:
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
    messages = [
        {"role": "system", "content": build_system_message()},
        {"role": "user",   "content": user_text}
    ]
    content = call_ollama_chat(messages, schema=schema)
    intent = json.loads(content)
    return intent

def load_guide():
    guide_path = os.path.join(os.path.dirname(__file__), "guide.txt")
    if not os.path.exists(guide_path):
        return None
    with open(guide_path, "r", encoding="utf-8") as f:
        return json.load(f)

def find_guide_answer(user_text, guide_data):
    if not guide_data:
        return None
    user_text_lower = user_text.lower()
    for key, items in guide_data.items():
        for item in items:
            if any(word in user_text_lower for word in item.lower().split()):
                return item
    return None

def ask_again(user_text):
    guide_txt_path = os.path.join(os.path.dirname(__file__), "guide.txt")
    if os.path.exists(guide_txt_path):
        with open(guide_txt_path, "r", encoding="utf-8") as f:
            guide_content = f.read()
        try:
            return ask_ollama_with_guide(user_text, guide_content).strip()
        except Exception as e:
            print(f"Error when querying Ollama: {e}")
            return "Unable to retrieve information from the system guide."
    else:
        return "Guide file guide.txt not found."

def control_device(device, action, user_text=None):
    if device == "DHT" and action == "query_temperature":
        temperature = get_temperature()
        return f"Temperature now is {temperature}°C." if temperature else "Unable to get temperature data."
    elif device == "DHT" and action == "query_humidity":
        humidity = get_humidity()
        return f"Humidity now is {humidity}%." if humidity else "Unable to get humidity data."
    elif action == "general_question":
        guide_data = load_guide()
        if guide_data:
            return ask_again(user_text or "")
        else:
            return "The information you requested is not available. Please contact customer service for assistance."
    else:
        return "Cannot control device or answer question."

__all__ = ["parse_intent", "control_device", "load_guide", "find_guide_answer"]
