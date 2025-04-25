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

app.Run();
