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
builder.Services.AddHostedService<MqttClientService>();
builder.Services.AddScoped<MyIoTPlatform.Application.Interfaces.Repositories.ITelemetryRepository, MyIoTPlatform.Infrastructure.Persistence.Repositories.TelemetryRepository>();
builder.Services.AddTransient<IRealtimeNotifier, RealtimeNotifier>();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<MyIoTPlatform.Domain.Interfaces.Services.IMachineLearningService, MyIoTPlatform.Infrastructure.MachineLearning.LocalAIService>();
builder.Services.AddScoped<MyIoTPlatform.Application.Interfaces.Persistence.IPredictionRepository, MyIoTPlatform.Infrastructure.Persistence.Repositories.PredictionRepository>();
builder.Services.AddScoped<IUnitOfWork, MyIoTPlatform.Infrastructure.Persistence.UnitOfWork>();
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDB"));

builder.Services.AddSingleton<MongoDbService>();
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
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });
builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<TokenService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<EnergyService>();
// builder.Services.AddTransient<MyIoTPlatform.API.Utilities.DatabaseInitializer>();
// builder.Services.AddScoped<MyIoTPlatform.API.Utilities.DatabaseInitializer>();
// builder.Services.AddTransient<MyIoTPlatform.API.Utilities.EnergyDataGenerator>();

var app = builder.Build();
// Initialize the database with sample data
// dùng để tạo data giả
// using (var scope = app.Services.CreateScope())
// {
//     var initializer = scope.ServiceProvider.GetRequiredService<MyIoTPlatform.API.Utilities.DatabaseInitializer>();
//     await initializer.InitializeAsync();
// }


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors(); // Áp dụng policy CORS

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<DashboardHub>("/dashboardhub"); // Map SignalR Hub endpoint

app.Run();

