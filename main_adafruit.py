from module import function_exAI
from module import mqttservice_ada

def main():
    while True:
        user_text = input("Bạn: ")
        if user_text.strip().lower() in ["exit", "quit"]:
            break
        intent = function_exAI.parse_intent(user_text)
        device = intent.get("device")
        action = intent.get("action")
        # Sử dụng hàm control_device của chatbot để lấy response
        response = function_exAI.control_device(device, action, user_text)
        print("Chatbot:", response)
        mqttservice_ada.publish_to_feed('response', response)

if __name__ == "__main__":
    main()
