namespace MyIoTPlatform.Infrastructure.Communication.Mqtt; // Hoặc PowerHub...
public class MqttConfig
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 1883;
    public string? ClientId { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? SubscribeTelemetryTopic { get; set; } // Thêm dòng này
    public string? SubscribeStateTopic { get; set; }     // Thêm dòng này
    // public int KeepAliveSeconds { get; set; } = 60;
}