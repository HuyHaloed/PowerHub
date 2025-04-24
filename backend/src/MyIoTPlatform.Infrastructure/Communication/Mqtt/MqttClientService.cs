using MediatR; // Cần cho ISender
using Microsoft.Extensions.DependencyInjection; // Cần cho IServiceProvider và CreateScope
using Microsoft.Extensions.Hosting; // Cần cho BackgroundService
using Microsoft.Extensions.Logging; // Cần cho ILogger
using Microsoft.Extensions.Options; // Cần cho IOptions<MqttConfig>
using MQTTnet; // Import namespace gốc
using MQTTnet.Packets;
using MQTTnet.Client;
using MQTTnet.Extensions.ManagedClient;
using MQTTnet.Protocol; // Cần cho MqttQualityOfServiceLevel
using MyIoTPlatform.Application.Features.Telemetry.Commands; // Command để xử lý telemetry
using MyIoTPlatform.Application.Interfaces.Communication; // Interface IMqttClientService
using MyIoTPlatform.Application.Features.Devices.Commands;
using System.Text;
using MyIoTPlatform.Application.Interfaces.Persistence; // ITelemetryMongoService
using MyIoTPlatform.Domain.Entities; // TelemetryData

namespace MyIoTPlatform.Infrastructure.Communication.Mqtt;

public class MqttClientService : BackgroundService, IMqttClientService
{
    private readonly ILogger<MqttClientService> _logger;
    private readonly MqttConfig _mqttConfig;
    private readonly IServiceProvider _serviceProvider; // Dùng để tạo Scope
    private IManagedMqttClient? _mqttClient; // Dùng Managed client để tự động kết nối lại

    public MqttClientService(
        IOptions<MqttConfig> mqttConfigOptions, // Inject IOptions
        ILogger<MqttClientService> logger,
        IServiceProvider serviceProvider) // Inject IServiceProvider
    {
        _logger = logger;
        _mqttConfig = mqttConfigOptions.Value; // Lấy giá trị cấu hình từ IOptions
        _serviceProvider = serviceProvider;
    }

    // Phương thức chính của BackgroundService, chạy khi ứng dụng khởi động
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MQTT BackgroundService is starting ExecuteAsync...");
        var factory = new MqttFactory(); // Không truyền logger vào Factory
        _mqttClient = factory.CreateManagedMqttClient();

        // --- Cấu hình Client Options ---
        var clientOptionsBuilder = new MqttClientOptionsBuilder()
            .WithClientId(_mqttConfig.ClientId ?? $"MyIoTBackend_{Guid.NewGuid()}")
            .WithTcpServer(_mqttConfig.Host, _mqttConfig.Port)
            .WithCleanSession();

        // Thêm Credentials nếu có
        if (!string.IsNullOrEmpty(_mqttConfig.Username))
        {
            clientOptionsBuilder.WithCredentials(_mqttConfig.Username, _mqttConfig.Password);
        }

        var clientOptions = clientOptionsBuilder.Build();

        // --- Cấu hình Managed Client Options ---
        // Managed client sẽ tự động quản lý kết nối và retry
        var managedOptions = new ManagedMqttClientOptionsBuilder()
            .WithAutoReconnectDelay(TimeSpan.FromSeconds(5)) // Thời gian chờ giữa các lần thử kết nối lại
            .WithClientOptions(clientOptions)
            .Build();

        // --- Đăng ký các Event Handler TRƯỚC KHI START ---
        _mqttClient.ConnectedAsync += OnConnectedAsync;
        _mqttClient.DisconnectedAsync += OnDisconnectedAsync;
        _mqttClient.ApplicationMessageReceivedAsync += OnMessageReceivedAsync;
        // Có thể đăng ký thêm các handler khác nếu cần

        _logger.LogInformation("Starting MQTT client connection to {Host}:{Port}...", _mqttConfig.Host, _mqttConfig.Port);
        _logger.LogInformation("MQTT Config: Host={Host}, Port={Port}, Topic={TelemetryTopic}",
        _mqttConfig.Host, _mqttConfig.Port, _mqttConfig.SubscribeTelemetryTopic);

        try
        {
            // Bắt đầu kết nối và duy trì kết nối
            _logger.LogInformation("MQTT Service Starting");
            await _mqttClient.StartAsync(managedOptions);
        }
        catch (Exception ex)
        {
            _logger.LogCritical(ex, "FATAL ERROR: Could not start MQTT client.");
            // Có thể dừng ứng dụng ở đây nếu MQTT là bắt buộc
            return;
        }


        // --- Giữ cho Background Service chạy ---
        // stoppingToken sẽ được kích hoạt khi ứng dụng yêu cầu dừng (shutdown)
        while (!stoppingToken.IsCancellationRequested)
        {
            // Có thể thêm logic kiểm tra trạng thái kết nối định kỳ ở đây nếu cần
            // Ví dụ: if(!_mqttClient.IsConnected) { _logger.LogWarning("MQTT Client is not connected!"); }
            try
            {
                // Chờ vô hạn cho đến khi có yêu cầu dừng
                await Task.Delay(Timeout.Infinite, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                // Bắt lỗi khi Task.Delay bị hủy bởi stoppingToken
                _logger.LogInformation("MQTT client stopping requested.");
            }
        }

        // --- Dọn dẹp khi ứng dụng dừng ---
        _logger.LogInformation("Stopping MQTT client...");
        try
        {
            // Hủy đăng ký các handler để tránh lỗi khi dispose
            if (_mqttClient != null)
            {
                _mqttClient.ConnectedAsync -= OnConnectedAsync;
                _mqttClient.DisconnectedAsync -= OnDisconnectedAsync;
                _mqttClient.ApplicationMessageReceivedAsync -= OnMessageReceivedAsync;
                await _mqttClient.StopAsync(); // Dừng client một cách nhẹ nhàng
                _mqttClient.Dispose(); // Giải phóng tài nguyên
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping MQTT client.");
        }
        _logger.LogInformation("MQTT client stopped.");
    }

    // --- Event Handler: Kết nối thành công ---
    private async Task OnConnectedAsync(MqttClientConnectedEventArgs e)
    {
        _logger.LogInformation("Successfully connected to MQTT Broker.");
        if (_mqttClient == null) return;

        var topics = new List<MqttTopicFilter>();

        // Lấy topic từ config hoặc dùng mặc định
        var telemetryTopic = _mqttConfig.SubscribeTelemetryTopic ?? "devices/+/telemetry";
        var stateTopic = _mqttConfig.SubscribeStateTopic ?? "devices/+/state";

        topics.Add(new MqttTopicFilterBuilder().WithTopic(telemetryTopic).WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtMostOnce).Build());
        topics.Add(new MqttTopicFilterBuilder().WithTopic(stateTopic).WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce).Build()); // State có thể cần QoS cao hơn

        _logger.LogInformation("Subscribing to topics: {TelemetryTopic}, {StateTopic}", telemetryTopic, stateTopic);

        try
        {
            await _mqttClient.SubscribeAsync(topics);
            // Log kết quả subscribe chi tiết hơn nếu cần...
            _logger.LogInformation("Subscription results");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error subscribing to topics");
        }
    }

    // --- Event Handler: Mất kết nối ---
    private Task OnDisconnectedAsync(MqttClientDisconnectedEventArgs e)
    {
        // Managed Client sẽ tự động thử kết nối lại
        _logger.LogWarning(e.Exception, "Disconnected from MQTT Broker. Reason: {Reason}. Will try to reconnect.", e.Reason);
        return Task.CompletedTask;
    }

    // --- Event Handler: Nhận được tin nhắn ---
    private async Task OnMessageReceivedAsync(MqttApplicationMessageReceivedEventArgs e)
    {
        var topic = e.ApplicationMessage.Topic;
        string payload;
        try { payload = Encoding.UTF8.GetString(e.ApplicationMessage.PayloadSegment); }
        catch (Exception ex) { _logger.LogError(ex, "Error subscribing to topics"); return; }

        _logger.LogDebug("Received message on topic '{Topic}': {Payload}", topic, payload);

        using (var scope = _serviceProvider.CreateScope())
        {
            var sender = scope.ServiceProvider.GetRequiredService<ISender>();
            var scopeLogger = scope.ServiceProvider.GetRequiredService<ILogger<MqttClientService>>();

            try
            {
                // --- Phân loại Topic ---
                // Giả định topic có dạng "devices/{deviceId}/..."
                var topicSegments = topic.Split('/');
                if (topicSegments.Length >= 3 && topicSegments[0].Equals("devices", StringComparison.OrdinalIgnoreCase))
                {
                    if (Guid.TryParse(topicSegments[1], out var deviceId)) // Giả sử deviceId là Guid trong topic
                    {
                        string messageType = topicSegments[2].ToLowerInvariant();
                        switch (messageType)
                        {
                            case "telemetry":
                                var telemetryService = scope.ServiceProvider.GetRequiredService<ITelemetryMongoService>();

                                var telemetry = new TelemetryData
                                {
                                    DeviceId = deviceId,
                                    Timestamp = DateTime.UtcNow,
                                    Key = "RawPayload",
                                    ValueJson = payload
                                };

                                await telemetryService.InsertTelemetryAsync(telemetry);
                                scopeLogger.LogInformation("Inserted telemetry to MongoDB for device {DeviceId}", deviceId);
                                break;


                            case "state":
                                // Tạo Command mới để xử lý cập nhật trạng thái từ thiết bị
                                var updateStateCmd = new UpdateDeviceStateCommand(deviceId, payload);
                                await sender.Send(updateStateCmd, CancellationToken.None);
                                scopeLogger.LogInformation("Processed state update from device {DeviceId}", deviceId);
                                break;

                            // Thêm các case khác nếu có loại topic khác (ví dụ: response, event...)
                            default:
                                scopeLogger.LogWarning("Unhandled message type '{MessageType}' on topic: {Topic}", messageType, topic);
                                break;
                        }
                    }
                    else
                    {
                        scopeLogger.LogWarning("Could not parse Guid DeviceId from topic: {Topic}", topic);
                    }
                }
                else
                {
                    scopeLogger.LogWarning("Received message on unstandardized topic: {Topic}", topic);
                }
            }
            catch (Exception ex)
            {
                scopeLogger.LogError(ex, "Error processing message from topic {Topic}. Payload: {Payload}", topic, payload);
            }
        }
    }


    // --- Triển khai phương thức Publish từ Interface IMqttClientService ---
    public async Task PublishAsync(string topic, string payload)
    {
        if (_mqttClient == null || !_mqttClient.IsStarted) // Kiểm tra cả IsStarted
        {
            _logger.LogWarning("MQTT client not started, cannot publish to topic {Topic}", topic);
            return;
        }
        // Có thể thêm kiểm tra _mqttClient.IsConnected nếu muốn chắc chắn hơn,
        // nhưng ManagedClient sẽ tự enqueue và gửi khi kết nối lại.

        var message = new MqttApplicationMessageBuilder()
            .WithTopic(topic)
            .WithPayload(payload)
            .WithRetainFlag(false) // Giá trị mặc định
            .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce) // Chọn QoS phù hợp khi gửi lệnh
            .Build();

        try
        {
            if (_mqttClient == null) return; // Added null check
            await _mqttClient.EnqueueAsync(message); // Corrected to directly await the method

            _logger.LogInformation("Successfully enqueued message to topic {Topic}", topic);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred while trying to enqueue message to topic {Topic}", topic);
        }
    }

    public async Task PublishAsync(string topic, string payload, bool retain, int qosLevel)
    {
        if (_mqttClient == null || !_mqttClient.IsStarted) // Added null and IsStarted check
        {
            _logger.LogWarning("MQTT client is not started or null. Cannot proceed.");
            return;
        }

        var message = new MqttApplicationMessageBuilder()
            .WithTopic(topic)
            .WithPayload(payload)
            .WithRetainFlag(retain)
            .WithQualityOfServiceLevel((MQTTnet.Protocol.MqttQualityOfServiceLevel)qosLevel)
            .Build();

        try
        {
            await _mqttClient.EnqueueAsync(message); // Corrected to use EnqueueAsync
            _logger.LogInformation("Message enqueued successfully to topic {Topic}", topic); // Corrected logging template
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to enqueue message to topic {Topic}", topic); // Corrected logging template
        }
    }

    // --- Hàm Helper để Parse DeviceId (Ví dụ) ---
    private Guid ParseDeviceIdFromTopic(string topic)
    {
        // Giả sử topic có dạng "devices/{deviceId}/telemetry"
        try
        {
            var parts = topic.Split('/');
            if (parts.Length >= 2 && parts[0].Equals("devices", StringComparison.OrdinalIgnoreCase))
            {
                if (Guid.TryParse(parts[1], out var deviceId))
                {
                    return deviceId;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing device ID from topic: {Topic}", topic);
        }
        return Guid.Empty; // Trả về Empty nếu không parse được
    }

    public async Task SubscribeAsync(string topic)
    {
        if (_mqttClient == null || !_mqttClient.IsStarted || !_mqttClient.IsConnected)
        {
            _logger.LogWarning("MQTT client not connected, cannot subscribe to topic {Topic} explicitly.", topic);
            return;
        }
        try
        {
            _logger.LogInformation("Explicitly subscribing to topic: {Topic}", topic);
            await _mqttClient.SubscribeAsync(topic, MqttQualityOfServiceLevel.AtMostOnce);
            // Có thể thêm log chi tiết kết quả subscribe như trong OnConnectedAsync nếu cần
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error explicitly subscribing to topic {Topic}", topic);
        }
    }
}