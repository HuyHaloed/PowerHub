using MediatR; // Cần cho ISender
using Microsoft.Extensions.DependencyInjection; // Cần cho IServiceProvider và CreateScope
using Microsoft.Extensions.Hosting; // Cần cho BackgroundService
using Microsoft.Extensions.Logging; // Cần cho ILogger
using Microsoft.Extensions.Options; // Cần cho IOptions<MqttConfig>
using MQTTnet; // Import namespace gốc
using MQTTnet.Client;
using MQTTnet.Extensions.ManagedClient;
using MQTTnet.Protocol; // Cần cho MqttQualityOfServiceLevel
using MyIoTPlatform.Application.Features.Telemetry.Commands; // Command để xử lý telemetry
using MyIoTPlatform.Application.Interfaces.Communication; // Interface IMqttClientService
using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic; // Cần cho List hoặc Array

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
        var factory = new MqttFactory(); // Không truyền logger vào Factory
        _mqttClient = factory.CreateManagedMqttClient();

        // --- Cấu hình Client Options ---
        var clientOptionsBuilder = new MqttClientOptionsBuilder()
            .WithClientId(_mqttConfig.ClientId ?? $"MyIoTBackend_{Guid.NewGuid()}")
            .WithTcpServer(_mqttConfig.Host, _mqttConfig.Port)
            .WithCleanSession()
            .WithKeepAlivePeriod(TimeSpan.FromSeconds(_mqttConfig.KeepAliveSeconds));

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
        try
        {
            // Bắt đầu kết nối và duy trì kết nối
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

        // Subscribe vào topic sau khi kết nối thành công
        var topic = _mqttConfig.SubscribeTopic ?? "devices/+/telemetry"; // Lấy từ config hoặc dùng mặc định
        try
        {
            _logger.LogInformation("Subscribing to topic: {Topic}", topic);
            var topicFilter = new MqttTopicFilterBuilder()
                .WithTopic(topic)
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtMostOnce)
                .Build(); // Adjusted to use MqttTopicFilterBuilder

            var subscribeResult = await _mqttClient.SubscribeAsync(new[] { topicFilter }); // Corrected to remove invalid assignmente

            foreach (var subResult in subscribeResult.Items)
            {
                if (subResult.ResultCode == MqttClientSubscribeResultCode.GrantedQoS0 ||
                    subResult.ResultCode == MqttClientSubscribeResultCode.GrantedQoS1 ||
                    subResult.ResultCode == MqttClientSubscribeResultCode.GrantedQoS2)
                {
                    _logger.LogInformation("Successfully subscribed to topic filter: {TopicFilter}", subResult.TopicFilter.Topic);
                }
                else
                {
                    _logger.LogError("Failed to subscribe to topic filter {TopicFilter}. Reason: {Reason}", subResult.TopicFilter.Topic, subResult.ResultCode);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error subscribing to topic {Topic}", topic);
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
        try
        {
            payload = Encoding.UTF8.GetString(e.ApplicationMessage.PayloadSegment); // Parse payload thành string UTF8
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to decode payload for topic {Topic}. Payload might not be UTF8.", topic);
            return; // Bỏ qua nếu không decode được
        }

        _logger.LogDebug("Received message on topic '{Topic}': {Payload}", topic, payload); // Dùng Debug level cho log chi tiết

        // !!! QUAN TRỌNG: Tạo Scope để lấy Scoped Services !!!
        using (var scope = _serviceProvider.CreateScope())
        {
            // Lấy ISender (MediatR) và Logger từ Scope mới
            var sender = scope.ServiceProvider.GetRequiredService<ISender>();
            var scopeLogger = scope.ServiceProvider.GetRequiredService<ILogger<MqttClientService>>(); // Có thể lấy logger từ scope

            try
            {
                // 1. Parse DeviceId từ Topic (Cần hàm helper riêng)
                var deviceId = ParseDeviceIdFromTopic(topic);

                if (deviceId != Guid.Empty)
                {
                    // 2. Tạo Command
                    var command = new IngestTelemetryCommand(deviceId, payload);

                    // 3. Gửi Command đến Application Handler
                    // Dùng CancellationToken.None vì việc xử lý message không nên bị hủy bởi stoppingToken của BackgroundService
                    await sender.Send(command, CancellationToken.None);

                    scopeLogger.LogInformation("Successfully processed message from device {DeviceId} on topic {Topic}", deviceId, topic);
                }
                else
                {
                    scopeLogger.LogWarning("Could not parse DeviceId from topic: {Topic}", topic);
                }
            }
            catch (Exception ex)
            {
                // Log lỗi xảy ra trong quá trình xử lý (ví dụ: handler lỗi, parse lỗi...)
                scopeLogger.LogError(ex, "Error processing message from topic {Topic}. Payload: {Payload}", topic, payload);
            }
        }
        // Scope sẽ tự động được dispose ở đây, giải phóng các dịch vụ Scoped
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
            var result = await _mqttClient.EnqueueAsync(message); // Explicitly defined as var is valid here

            if (result.ReasonCode == MqttClientPublishReasonCode.Success) // Corrected enum reference
            {
                _logger.LogInformation("Successfully enqueued message to topic {Topic}", topic);
            }
            else
            {
                _logger.LogError("Failed to enqueue message to topic {Topic}. Reason: {ReasonCode}", topic, result.ReasonCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred while trying to enqueue message to topic {Topic}", topic);
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