namespace MyIoTPlatform.Infrastructure.Communication.Mqtt;

public class MqttConfig
{
    public string Host { get; set; } = string.Empty; // Địa chỉ IP hoặc tên domain của MQTT Broker
    public int Port { get; set; } = 1883;          // Port mặc định của MQTT (không mã hóa)
    public string? ClientId { get; set; }          // ID định danh cho client này (để trống sẽ tự sinh)
    public string? Username { get; set; }          // Username để kết nối (nếu broker yêu cầu)
    public string? Password { get; set; }          // Password để kết nối (nếu broker yêu cầu)
    public string? SubscribeTopic { get; set; }    // Topic lắng nghe dữ liệu từ thiết bị (ví dụ: "devices/+/telemetry")
    public int KeepAliveSeconds { get; set; } = 60; // Thời gian gửi tín hiệu "còn sống"
}