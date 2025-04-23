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
            .WithKeepAlivePeriod(TimeSpan.FromSeconds(60)); // Giá trị mặc định 60 giây

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
            try
            {
                // Chờ một khoảng thời gian ngắn thay vì vô hạn
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                
                // Kiểm tra trạng thái kết nối định kỳ
                if (_mqttClient != null && !_mqttClient.IsConnected)
                {
                    _logger.LogWarning("MQTT client is not connected. Waiting for auto-reconnect...");
                }
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

        try
        {
            // Subscribe vào topic telemetry và state
            var telemetryTopic = "devices/+/telemetry";
            var stateTopic = "devices/+/state";
            
            _logger.LogInformation("Subscribing to topics: {TelemetryTopic}, {StateTopic}", telemetryTopic, stateTopic);
            
            var topicFilters = new[]
            {
                new MqttTopicFilterBuilder()
                    .WithTopic(telemetryTopic)
                    .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                    .Build(),
                new MqttTopicFilterBuilder()
                    .WithTopic(stateTopic)
                    .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                    .Build()
            };
            
            await _mqttClient.SubscribeAsync(topicFilters);
            
            _logger.LogInformation("Successfully subscribed to topics");
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
        _logger.LogWarning("Disconnected from MQTT Broker. Reason: {Reason}. Will try to reconnect.", e.Reason);
        return Task.CompletedTask;
    }

    // --- Event Handler: Nhận được tin nhắn ---
    private async Task OnMessageReceivedAsync(MqttApplicationMessageReceivedEventArgs e)
    {
        var topic = e.ApplicationMessage.Topic;
        string? payload = null;
        
        // === Log chi tiết khi nhận tin nhắn ===
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("\n==================================================");
        Console.WriteLine($"🔔 TIN NHẮN MQTT NHẬN ĐƯỢC - TOPIC: {topic}");
        Console.WriteLine("==================================================");
        
        try
        {
            // Lấy nội dung tin nhắn
            payload = Encoding.UTF8.GetString(e.ApplicationMessage.PayloadSegment);
            
            // Hiển thị payload
            Console.WriteLine($"📄 PAYLOAD: {payload}");
            
            // Hiển thị hexdump để debug
            var hexPayload = BitConverter.ToString(e.ApplicationMessage.PayloadSegment.ToArray());
            Console.WriteLine($"🔍 HEX: {hexPayload}");
            
            // Thông tin QoS và Retain
            Console.WriteLine($"📊 QoS: {e.ApplicationMessage.QualityOfServiceLevel}, Retain: {e.ApplicationMessage.Retain}");
            
            // Đặt lại màu console
            Console.ResetColor();
            
            // Log thông thường
            _logger.LogInformation("Received message on topic '{Topic}': {Payload}", topic, payload);
            
            // Validate JSON format
            if (string.IsNullOrEmpty(payload) || payload.Trim().Length == 0)
            {
                _logger.LogWarning("Empty payload received for topic {Topic}", topic);
                return;
            }
            
            // Kiểm tra payload có phải là JSON hợp lệ không
            try
            {
                System.Text.Json.JsonDocument.Parse(payload);
                Console.WriteLine("✅ JSON hợp lệ!");
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"❌ JSON không hợp lệ: {jsonEx.Message}");
                Console.ResetColor();
                _logger.LogWarning("Invalid JSON payload received for topic {Topic}: {Error}", topic, jsonEx.Message);
                _logger.LogDebug("Invalid payload content: {Payload}", payload);
                return;
            }

            // !!! QUAN TRỌNG: Tạo Scope để lấy Scoped Services !!!
            using (var scope = _serviceProvider.CreateScope())
            {
                // Lấy ISender (MediatR) từ Scope mới
                var sender = scope.ServiceProvider.GetRequiredService<ISender>();

                try
                {
                    // 1. Parse DeviceId từ Topic
                    var deviceId = ParseDeviceIdFromTopic(topic);
                    Console.WriteLine($"📱 Device ID: {deviceId}");

                    if (deviceId != Guid.Empty)
                    {
                        // 2. Tạo Command
                        var command = new IngestTelemetryCommand(deviceId, payload);

                        // 3. Gửi Command đến Application Handler
                        Console.WriteLine("🚀 Gửi lệnh xử lý đến application handler...");
                        await sender.Send(command, CancellationToken.None);

                        Console.ForegroundColor = ConsoleColor.Green;
                        Console.WriteLine($"✅ Xử lý thành công tin nhắn từ thiết bị {deviceId} trên topic {topic}");
                        Console.ResetColor();
                        _logger.LogInformation("Successfully processed message from device {DeviceId} on topic {Topic}", deviceId, topic);
                    }
                    else
                    {
                        Console.ForegroundColor = ConsoleColor.Yellow;
                        Console.WriteLine("⚠️ Không thể phân tích Device ID từ topic");
                        Console.ResetColor();
                        _logger.LogWarning("Could not parse DeviceId from topic: {Topic}", topic);
                    }
                }
                catch (Exception ex)
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine($"❌ Lỗi xử lý tin nhắn: {ex.Message}");
                    Console.WriteLine(ex.StackTrace);
                    Console.ResetColor();
                    _logger.LogError(ex, "Error processing message from topic {Topic}. Payload: {Payload}", topic, payload);
                }
            }
            
            Console.WriteLine("==================================================\n");
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"❌ LỖI NGHIÊM TRỌNG khi xử lý tin nhắn: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
            Console.ResetColor();
            _logger.LogError(ex, "Critical error during message processing from topic {Topic}", topic);
        }
    }

    // --- Triển khai phương thức Publish từ Interface IMqttClientService ---
    public async Task PublishAsync(string topic, string payload)
    {
        if (_mqttClient == null || !_mqttClient.IsStarted)
        {
            _logger.LogWarning("MQTT client not started, cannot publish to topic {Topic}", topic);
            return;
        }

        try
        {
            var message = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(payload)
                .WithRetainFlag(false)
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            await _mqttClient.EnqueueAsync(message);
            _logger.LogInformation("Successfully enqueued message to topic {Topic}", topic);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred while trying to enqueue message to topic {Topic}", topic);
        }
    }

    public async Task PublishAsync(string topic, string payload, bool retain, int qosLevel)
    {
        if (_mqttClient == null || !_mqttClient.IsStarted)
        {
            _logger.LogWarning("MQTT client is not started or null. Cannot proceed.");
            return;
        }

        try
        {
            // Kiểm tra và giới hạn giá trị qosLevel hợp lệ (0-2)
            qosLevel = Math.Max(0, Math.Min(2, qosLevel));
            
            var message = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(payload)
                .WithRetainFlag(retain)
                .WithQualityOfServiceLevel((MqttQualityOfServiceLevel)qosLevel)
                .Build();

            await _mqttClient.EnqueueAsync(message);
            _logger.LogInformation("Message enqueued successfully to topic {Topic}", topic);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to enqueue message to topic {Topic}", topic);
        }
    }

    // --- Hàm Helper để Parse DeviceId ---
    private Guid ParseDeviceIdFromTopic(string topic)
    {
        // Giả sử topic có dạng "devices/{deviceId}/telemetry" hoặc "devices/{deviceId}/state"
        try
        {
            var parts = topic.Split('/');
            if (parts.Length >= 3 && parts[0].Equals("devices", StringComparison.OrdinalIgnoreCase))
            {
                // Nếu deviceId không phải là Guid, thử tạo một Guid từ string
                if (!Guid.TryParse(parts[1], out var deviceId))
                {
                    // Nếu không phải Guid, tạo Guid dựa trên hash của string
                    deviceId = CreateDeterministicGuid(parts[1]);
                    _logger.LogDebug("Created deterministic GUID {Guid} for device identifier {DeviceId}", deviceId, parts[1]);
                }
                return deviceId;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing device ID from topic: {Topic}", topic);
        }
        return Guid.Empty; // Trả về Empty nếu không parse được
    }
    
    // Tạo Guid từ string để xử lý trường hợp identifier không phải Guid
    private Guid CreateDeterministicGuid(string input)
    {
        if (string.IsNullOrEmpty(input))
            return Guid.Empty;
            
        // Tạo hash từ input
        using var md5 = System.Security.Cryptography.MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(input));
        
        // Chuyển hash thành Guid (version 3 - MD5)
        var guid = new Guid(hash);
        return guid;
    }

    public async Task SubscribeAsync(string topic)
    {
        if (_mqttClient == null)
        {
            _logger.LogWarning("MQTT client is null, cannot subscribe to topic {Topic}", topic);
            return;
        }

        try
        {
            _logger.LogInformation("Explicitly subscribing to topic: {Topic}", topic);
            
            var topicFilter = new MqttTopicFilterBuilder()
                .WithTopic(topic)
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();
                
            await _mqttClient.SubscribeAsync(new[] { topicFilter });
                
            _logger.LogInformation("Successfully subscribed to topic: {Topic}", topic);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error explicitly subscribing to topic {Topic}", topic);
        }
    }
}