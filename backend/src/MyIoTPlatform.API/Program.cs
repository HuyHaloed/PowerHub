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

// Đăng ký database initializer TRƯỚC KHI BUILD
builder.Services.AddApplicationServices(); 
builder.Services.AddInfrastructureServices(builder.Configuration); 
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddSignalR();
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

// Đăng ký DatabaseInitializer TRƯỚC KHI BUILD
builder.Services.AddTransient<MyIoTPlatform.API.Utilities.DatabaseInitializer>();
builder.Services.AddTransient<MyIoTPlatform.API.Utilities.EnvironmentDataGenerator>();

// Build app
var app = builder.Build();

// // Sử dụng DatabaseInitializer SAU KHI BUILD
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