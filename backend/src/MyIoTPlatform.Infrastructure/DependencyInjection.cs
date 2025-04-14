using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting; // Cần cho IHostedService
using MyIoTPlatform.Application.Interfaces.Communication; // Interface IMqttClientService
using MyIoTPlatform.Infrastructure.Communication.Mqtt;
using MyIoTPlatform.Application.Features.MachineLearning.Services;
using MyIoTPlatform.Infrastructure.Services;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using MyIoTPlatform.Infrastructure.Persistence.Repositories;
using MyIoTPlatform.Infrastructure.MachineLearning; // Added namespace for FreeMlService
// ... các using khác ...

namespace MyIoTPlatform.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // ... (Đăng ký DbContext, Repositories...)

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
        services.AddScoped<IAzureMlService, FreeMlService>();

        // Register repositories for Rules and Dashboards
        services.AddScoped<IRuleRepository, RuleRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();

        // ... (Đăng ký RealtimeNotifier, AzureMlService...)

        return services;
    }
}