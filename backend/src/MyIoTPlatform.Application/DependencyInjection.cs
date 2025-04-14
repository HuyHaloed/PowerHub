using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace MyIoTPlatform.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // AutoMapper
        services.AddAutoMapper(Assembly.GetExecutingAssembly());

        // FluentValidation
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        // MediatR
        services.AddMediatR(typeof(DependencyInjection).Assembly);
        // Có thể thêm các behaviors (pipeline) cho MediatR ở đây nếu cần (Logging, Validation...)
        // cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        return services;
    }

    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Register MediatR for handling commands and queries
        services.AddMediatR(typeof(DependencyInjection).Assembly);

        // Add other application-specific services here

        return services;
    }
}