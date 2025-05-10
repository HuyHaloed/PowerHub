# AI Chatbot - Hướng dẫn sử dụng

## Giới thiệu
Chatbot này sử dụng mô hình AI từ Ollama hoặc Openrouter để phân tích ngữ nghĩa tiếng Anh, điều khiển thiết bị (đèn, quạt), và truy vấn dữ liệu cảm biến (nhiệt độ, độ ẩm, điện năng tiêu thụ) qua Adafruit IO.

## Cách sử dụng

### 1. Hỏi thông tin cảm biến
- **Nhiệt độ:**  
  `Nhiệt độ phòng là bao nhiêu?`  
  `What is the temperature now?`
- **Độ ẩm:**  
  `Độ ẩm hiện tại là bao nhiêu?`  
  `What is the current humidity?`
- **Điện năng tiêu thụ:**  
  `Điện năng tiêu thụ tháng này là bao nhiêu?`  
  `What is the power consumption for this month?`

### 2. Điều khiển thiết bị
- **Bật/tắt đèn:**  
  `Bật đèn` / `Turn on the light`  
  `Tắt đèn` / `Turn off the light`
- **Bật/tắt quạt:**  
  `Bật quạt` / `Turn on the fan`  
  `Tắt quạt` / `Turn off the fan`

### 3. Hỏi về hệ thống hoặc hỗ trợ
- `Hệ thống có thể làm gì?`
- `Làm sao để cập nhật thông tin cá nhân?`
- `Liên hệ hỗ trợ khách hàng như thế nào?`

### 4. Một số lưu ý
- Chatbot sẽ tự động nhận diện ý định và trả lời hoặc điều khiển thiết bị phù hợp.
- Nếu không rõ câu trả lời, chatbot sẽ dựa vào file hướng dẫn (`guide.txt`) để hỗ trợ bạn.

---

## Cấu trúc file hướng dẫn (guide.txt)
File `guide.txt` chứa các thông tin hướng dẫn, ví dụ và hỗ trợ khách hàng. Bạn có thể chỉnh sửa file này để cập nhật nội dung phù hợp với hệ thống của mình.

---

## Liên hệ hỗ trợ
Nếu cần trợ giúp thêm, vui lòng liên hệ bộ phận hỗ trợ khách hàng theo thông tin trong `guide.txt`.
