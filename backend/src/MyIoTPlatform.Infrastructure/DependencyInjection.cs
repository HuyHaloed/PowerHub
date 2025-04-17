using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MyIoTPlatform.Application.Interfaces.Persistence; // Interface IApplicationDbContext
using MyIoTPlatform.Domain.Interfaces.Repositories; 
using MyIoTPlatform.Application.Interfaces.Communication; // Interface IMqttClientService
using MyIoTPlatform.Infrastructure.Communication.Mqtt;
using MyIoTPlatform.Domain.Interfaces.Services;
using MyIoTPlatform.Infrastructure.Persistence.DbContexts;
using MyIoTPlatform.Infrastructure.Persistence.Repositories;
using MyIoTPlatform.Infrastructure.MachineLearning; // Added namespace for FreeMlService
// ... các using khác ...

namespace MyIoTPlatform.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // ... (Đăng ký DbContext, Repositories...)
        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());


        // === Repositories (Vòng đời Scoped) ===
        services.AddScoped<IDeviceRepository, DeviceRepository>();
        // services.AddScoped<ITelemetryRepository, TelemetryRepository>();
        // services.AddScoped<IUserRepository, UserRepository>();       
        // services.AddScoped<IUnitOfWork, UnitOfWork>(); 
        // ========================================


        // === MQTT Service ===
        // 1. Đọc cấu hình từ appsettings vào lớp MqttConfig
        services.Configure<MqttConfig>(configuration.GetSection("Mqtt"));

        // 2. Đăng ký MqttClientService là Singleton (chỉ có 1 instance chạy suốt đời ứng dụng)
        services.AddSingleton<MqttClientService>();

        // 3. Đăng ký instance Singleton đó dưới dạng Interface IMqttClientService
        //    để các service khác có thể inject Interface thay vì class cụ thể.
        services.AddSingleton<IMqttClientService>(provider =>
            provider.GetRequiredService<MqttClientService>());

        // 4. Đăng ký MqttClientService như một Hosted Service để ASP.NET Core
        //    tự động chạy phương thức ExecuteAsync khi ứng dụng khởi động.
        services.AddHostedService(provider =>
            provider.GetRequiredService<MqttClientService>());
        // =====================

        // Register FreeMlService as the implementation for IAzureMlService
        services.AddScoped<IMachineLearningService, FreeMlService>();

        // Register repositories for Rules and Dashboards
        services.AddScoped<IRuleRepository, RuleRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();

        // ... (Đăng ký RealtimeNotifier, AzureMlService...)

        return services;
    }
}