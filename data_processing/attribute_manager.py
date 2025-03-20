import paho.mqtt.client as mqtt
import json
import time

class AttributeManager:
    def __init__(self, broker="app.coreiot.io", port=1883, access_token=None):
        """
        Khởi tạo AttributeManager để quản lý và truy xuất shared attributes
        
        :param broker: Địa chỉ broker MQTT
        :param port: Cổng kết nối
        :param access_token: Token xác thực
        """
        self.broker = broker
        self.port = port
        self.access_token = access_token
        
        # Client MQTT
        self.client = mqtt.Client(client_id=f"attribute_manager_{int(time.time())}")
        
        # Lưu trữ các thuộc tính
        self.shared_attributes = {}
        
        # Cài đặt các callback
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message

    def _on_connect(self, client, userdata, flags, rc):
        """
        Callback khi kết nối thành công
        """
        if rc == 0:
            print("Kết nối đến CoreIOT thành công để quản lý thuộc tính")
            # Đăng ký nhận phản hồi thuộc tính
            client.subscribe("v1/devices/me/attributes/response/+")
        else:
            print(f"Kết nối thất bại. Mã lỗi: {rc}")

    def _on_message(self, client, userdata, msg):
        """
        Xử lý tin nhắn nhận được (phản hồi thuộc tính)
        """
        try:
            payload = json.loads(msg.payload.decode('utf-8'))
            print(f"Nhận thuộc tính: {payload}")
            
            # Cập nhật thuộc tính được chia sẻ
            if 'shared' in payload:
                self.shared_attributes.update(payload['shared'])
        except json.JSONDecodeError:
            print("Lỗi giải mã JSON")
        except Exception as e:
            print(f"Lỗi xử lý tin nhắn: {e}")

    def get_shared_attribute(self, attribute_key, timeout=10):
        """
        Lấy giá trị của một shared attribute cụ thể
        
        :param attribute_key: Khóa thuộc tính cần lấy
        :param timeout: Thời gian chờ tối đa (giây)
        :return: Giá trị của thuộc tính hoặc None
        """
        # Tạo ID yêu cầu duy nhất
        request_id = int(time.time())
        
        # Kết nối đến broker
        self.client.username_pw_set(self.access_token)
        self.client.connect(self.broker, self.port)
        self.client.loop_start()
        
        # Gửi yêu cầu lấy thuộc tính
        request_payload = json.dumps({
            "id": request_id,
            "method": "getAttributes",
            "params": {
                "shared": [attribute_key]
            }
        })
        
        self.client.publish(
            f"v1/devices/me/attributes/request/{request_id}", 
            request_payload
        )
        
        # Chờ nhận giá trị
        start_time = time.time()
        while time.time() - start_time < timeout:
            if attribute_key in self.shared_attributes:
                value = self.shared_attributes[attribute_key]
                self.client.disconnect()
                return value
            time.sleep(0.1)
        
        # Hết thời gian chờ
        self.client.disconnect()
        print(f"Hết thời gian chờ khi lấy thuộc tính {attribute_key}")
        return None

    def watch_shared_attributes(self, attributes_list):
        """
        Theo dõi nhiều shared attributes
        
        :param attributes_list: Danh sách các thuộc tính cần theo dõi
        :return: Từ điển các giá trị thuộc tính
        """
        results = {}
        for attr in attributes_list:
            results[attr] = self.get_shared_attribute(attr)
        return results

# Ví dụ sử dụng
def main():
    # Sử dụng token từ CoreIOT
    ACCESS_TOKEN = "rsoMvGsRuM9iNbDZBZd3"
    
    # Khởi tạo trình quản lý thuộc tính
    attr_manager = AttributeManager(access_token=ACCESS_TOKEN)
    
    # Lấy một thuộc tính cụ thể
    shared_time = attr_manager.get_shared_attribute("sharedTime")
    print(f"Giá trị sharedTime: {shared_time}")
    
    # Theo dõi nhiều thuộc tính
    attributes = attr_manager.watch_shared_attributes([
        "sharedTime", 
        "deviceStatus", 
        "powerThreshold"
    ])
    print("Các thuộc tính được chia sẻ:", attributes)

if __name__ == "__main__":
    main()