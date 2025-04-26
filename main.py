import chatbot
import mqttservice

def main():
    while True:
        user_text = input("Bạn: ")
        if user_text.strip().lower() in ["exit", "quit"]:
            break
        intent = chatbot.parse_intent(user_text)
        device = intent.get("device")
        action = intent.get("action")
        # Sử dụng hàm control_device của chatbot để lấy response
        response = chatbot.control_device(device, action, user_text)
        print("Chatbot:", response)
        mqttservice.publish_to_feed('response', response)

if __name__ == "__main__":
    main()
