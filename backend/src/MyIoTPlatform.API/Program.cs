// Ví dụ rút gọn trong Program.cs
using MyIoTPlatform.Application; // Assuming AddApplicationServices is defined here
using MyIoTPlatform.Infrastructure; // Assuming AddInfrastructureServices is defined here
using MyIoTPlatform.Infrastructure.Communication.Realtime; // For DashboardHub
using MyIoTPlatform.Infrastructure.Communication.Mqtt; // For MqttClientService

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
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // URL của React app development server
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Cần thiết cho SignalR với credentials
    });
});


// Add SignalR
builder.Services.AddSignalR();

// Đăng ký MQTT Client như một Hosted Service để nó tự chạy nền
builder.Services.AddHostedService<MqttClientService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowReactApp"); // Áp dụng policy CORS

// Add Authentication/Authorization middleware here if needed

app.UseAuthorization();

app.MapControllers();
app.MapHub<DashboardHub>("/dashboardhub"); // Map SignalR Hub endpoint

app.Run();