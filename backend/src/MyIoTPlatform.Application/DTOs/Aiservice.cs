namespace MyIoTPlatform.Application.DTOs
{
    public class PredictRequest
    {
        // Đây là cấu trúc dữ liệu bạn gửi đến AI service
        public Dictionary<string, object> Data { get; set; }
    }

    public class PredictionResult
    {
        // Kết quả trả về từ AI service
        public double Value { get; set; }
    }

    public class VoiceRequest
    {
        // Ví dụ: mảng byte của âm thanh đầu vào
        public byte[] Audio { get; set; }
    }

    public class VoiceResult
    {
        // Kết quả lệnh giọng nói (ví dụ: TURN_ON_LIGHT)
        public string Command { get; set; }
    }
}
