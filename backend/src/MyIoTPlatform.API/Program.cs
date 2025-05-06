// Ví dụ rút gọn trong Program.cs
using Microsoft.EntityFrameworkCore;
using MyIoTPlatform.Application; // Assuming AddApplicationServices is defined here
using MyIoTPlatform.Infrastructure; // Assuming AddInfrastructureServices is defined here
using MyIoTPlatform.Infrastructure.Communication.Realtime; // For DashboardHub
using MyIoTPlatform.Infrastructure.Communication.Mqtt; // For MqttClientService
using MyIoTPlatform.Infrastructure.Persistence.DbContexts; // For ApplicationDbContext
using MyIoTPlatform.Application.Interfaces.Communication;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using MyIoTPlatform.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using MyIoTPlatform.Application.Interfaces.Persistence;
using MyIoTPlatform.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.Google;
using System.Text;
using MyIoTPlatform.Infrastructure.Communication.Adafruit;
using System.Net.WebSockets;
using MQTTnet;
using MQTTnet.Client;
using System.Collections.Concurrent;
using MyIoTPlatform.API.Controllers;


var builder = WebApplication.CreateBuilder(args);



// Add services to the container.
builder.Services.AddApplicationServices(); // Registers MediatR, AutoMapper, Validators
builder.Services.AddInfrastructureServices(builder.Configuration); // Registers DBContext, Repos, Mqtt, ML Service etc.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS (Example: Allow any origin for development)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
    {
        policy.WithOrigins("http://localhost:5173") // URL của React app development server
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Cần thiết cho SignalR với credentials
    });
});


// Add SignalR
builder.Services.AddSignalR();

// Đăng ký MQTT Client như một Hosted Service để nó tự chạy nền
builder.Services.Configure<MyIoTPlatform.API.Services.MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbAPI"));

builder.Services.Configure<MyIoTPlatform.Infrastructure.Persistence.Settings.MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbInfra"));
builder.Services.AddSingleton<ITelemetryMongoService, MyIoTPlatform.Infrastructure.Persistence.MongoDbService>();
builder.Services.AddSingleton<MyIoTPlatform.API.Services.MongoDbService>();

builder.Services.Configure<MqttConfig>(builder.Configuration.GetSection("Mqtt"));
// builder.Services.AddSingleton<IMqttClientService, MqttClientService>();
// builder.Services.AddHostedService<MqttClientService>();
builder.Services.AddScoped<MyIoTPlatform.Application.Interfaces.Repositories.ITelemetryRepository, MyIoTPlatform.Infrastructure.Persistence.Repositories.TelemetryRepository>();
builder.Services.AddTransient<IRealtimeNotifier, RealtimeNotifier>();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<MyIoTPlatform.Domain.Interfaces.Services.IMachineLearningService, MyIoTPlatform.Infrastructure.MachineLearning.LocalAIService>();
builder.Services.AddScoped<MyIoTPlatform.Application.Interfaces.Persistence.IPredictionRepository, MyIoTPlatform.Infrastructure.Persistence.Repositories.PredictionRepository>();
builder.Services.AddScoped<IUnitOfWork, MyIoTPlatform.Infrastructure.Persistence.UnitOfWork>();
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDB"));

builder.Services.AddSingleton<MyIoTPlatform.API.Services.MongoDbService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => 
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured")))
        };
    });
builder.Services.AddSingleton<TokenService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<EnergyService>();
builder.Services.AddAuthentication()
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Authentication:Google:ClientId"] ?? throw new InvalidOperationException("Google ClientId not configured");
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"] ?? throw new InvalidOperationException("Google ClientSecret not configured");
    });
// Đăng ký DatabaseInitializer TRƯỚC KHI BUILD
builder.Services.AddTransient<MyIoTPlatform.API.Utilities.DatabaseInitializer>();
builder.Services.AddTransient<MyIoTPlatform.API.Utilities.EnvironmentDataGenerator>();
builder.Services.AddScoped<PasswordResetService>();
builder.Services.AddScoped<IEmailService, SimpleEmailService>();
builder.Services.AddScoped<UserService>();


// Configure Adafruit MQTT Client
builder.Services.Configure<AdafruitMqttConfig>(builder.Configuration.GetSection("Adafruit"));
builder.Services.AddSingleton<IMqttClientService, AdafruitMqttService>();
builder.Services.AddHostedService<AdafruitMqttService>();

// THÊM ĐĂNG KÝ CHO MQTT CLIENT và CÁC DỊCH VỤ SCHEDULER
// Đăng ký IMqttClient
builder.Services.AddSingleton<IMqttClient>(sp =>
{
    var factory = new MqttFactory();
    var client = factory.CreateMqttClient();
    
    // Tạo options từ cấu hình
    var mqttConfig = builder.Configuration.GetSection("Mqtt");
    var options = new MqttClientOptionsBuilder()
        .WithClientId(mqttConfig["ClientId"] ?? $"api-client-{Guid.NewGuid()}")
        .WithTcpServer(mqttConfig["Host"] ?? "192.168.1.9", int.Parse(mqttConfig["Port"] ?? "1883"))
        .Build();

    // Xử lý kết nối lại khi bị ngắt
    client.DisconnectedAsync += async e =>
    {
        Console.WriteLine("MQTT client disconnected. Trying to reconnect in 5 seconds...");
        await Task.Delay(TimeSpan.FromSeconds(5));
        try
        {
            await client.ConnectAsync(options);
            Console.WriteLine("MQTT client reconnected.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"MQTT reconnection failed: {ex.Message}");
        }
    };

    // Kết nối ngay lập tức (tùy chọn)
    // client.ConnectAsync(options).GetAwaiter().GetResult();
    
    return client;
});

// Đăng ký ConcurrentDictionary cho lưu trữ lịch trình
builder.Services.AddSingleton<ConcurrentDictionary<string, DeviceScheduleEntry>>();

// Đăng ký ScheduleBackgroundService
builder.Services.AddHostedService<ScheduleBackgroundService>();

// Build app
var app = builder.Build();

// Sử dụng DatabaseInitializer SAU KHI BUILD
// if (app.Environment.IsDevelopment())
// {
//     app.UseSwagger();
//     app.UseSwaggerUI();
    
//     // Chỉ chạy initializer trong môi trường development
//     using (var scope = app.Services.CreateScope())
//     {
//         var initializer = scope.ServiceProvider.GetRequiredService<MyIoTPlatform.API.Utilities.DatabaseInitializer>();
//         await initializer.InitializeAsync();
//     }
// }

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
// Thêm sau các cấu hình dịch vụ và trước app.Run()

// Cấu hình WebSocket
app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromMinutes(2)
});

// Xử lý yêu cầu WebSocket
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/ws")
    {
        if (context.WebSockets.IsWebSocketRequest)
        {
            using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
            var serviceProvider = context.RequestServices;
            var mqttService = serviceProvider.GetRequiredService<IMqttClientService>();
            
            await HandleWebSocketConnection(webSocket, context.RequestAborted, mqttService);
        }
        else
        {
            context.Response.StatusCode = 400;
        }
    }
    else
    {
        await next();
    }
});

// Thêm hàm xử lý WebSocket
async Task HandleWebSocketConnection(WebSocket webSocket, CancellationToken cancellationToken, IMqttClientService mqttService)
{
    // Tạo một completion source để theo dõi khi WebSocket hoàn thành
    var socketFinishedTcs = new TaskCompletionSource<object>();
    cancellationToken.Register(() => socketFinishedTcs.TrySetResult(null));
    
    // Đăng ký sự kiện nhận tin nhắn MQTT
    void MessageReceivedHandler(object sender, MqttMessageReceivedEventArgs args)
    {
        if (webSocket.State == WebSocketState.Open)
        {
            var message = Encoding.UTF8.GetBytes(System.Text.Json.JsonSerializer.Serialize(new
            {
                feed = args.Topic,
                value = args.Payload
            }));
            
            webSocket.SendAsync(
                new ArraySegment<byte>(message, 0, message.Length),
                WebSocketMessageType.Text,
                true,
                cancellationToken).GetAwaiter().GetResult();
        }
    }
    
    // Cast và đăng ký event

    AdafruitMqttService adafruitService = null;
    if (mqttService is AdafruitMqttService service)
    {
        adafruitService = service;
        adafruitService.MessageReceived += MessageReceivedHandler;
    }
    
    // Duy trì kết nối
    var buffer = new byte[1024 * 4];
    try
    {
        while (webSocket.State == WebSocketState.Open)
        {
            var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationToken);
            if (result.MessageType == WebSocketMessageType.Close)
            {
                await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Connection closed by client", cancellationToken);
                break;
            }
        }
    }
    catch (OperationCanceledException)
    {
        // Bình thường khi hủy
    }
    catch (Exception ex)
    {
        // Log lỗi nếu cần
    }
    finally
    {
        // Hủy đăng ký sự kiện
        if (adafruitService != null)
        {
            adafruitService.MessageReceived -= MessageReceivedHandler;
        }
        
        // Đảm bảo WebSocket đóng
        if (webSocket.State != WebSocketState.Closed && webSocket.State != WebSocketState.Aborted)
        {
            await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Server closing connection", CancellationToken.None);
        }
    }
}

app.Run();