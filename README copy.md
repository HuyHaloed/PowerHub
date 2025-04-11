```
MyIoTPlatformSolution.sln
/src
|
|--- MyIoTPlatform.Domain/                      # Core layer, does not depend on other layers
|   |--- Entities/                              # Main business objects
|   |   |--- Device.cs
|   |   |--- TelemetryData.cs
|   |   |--- DeviceType.cs
|   |   |--- User.cs
|   |   |--- Alarm.cs
|   |--- Enums/                                 # Common enum types
|   |   |--- DeviceStatus.cs
|   |   |--- AlarmSeverity.cs
|   |--- Interfaces/                            # Interfaces for Repositories or Domain Services
|   |   |--- Repositories/
|   |   |   |--- IDeviceRepository.cs
|   |   |   |--- ITelemetryRepository.cs
|   |   |--- Services/
|   |--- Common/                                # Common base classes or structures within the Domain
|   |--- Exceptions/                            # Custom business exceptions
|   |--- MyIoTPlatform.Domain.csproj
|
|--- MyIoTPlatform.Application/                 # Business Logic Layer, Use Cases
|   |--- Features/                              # Organized by business feature (Vertical Slices)
|   |   |--- Devices/
|   |   |   |--- Commands/                      # Commands (Create, Update, Delete)
|   |   |   |   |--- RegisterDeviceCommand.cs
|   |   |   |   |--- RegisterDeviceCommandHandler.cs
|   |   |   |--- Queries/                       # Queries (Get)
|   |   |   |   |--- GetDeviceByIdQuery.cs
|   |   |   |   |--- GetDeviceByIdQueryHandler.cs
|   |   |   |--- DTOs/                          # Data Transfer Objects for Device business
|   |   |   |   |--- DeviceDto.cs
|   |   |--- Telemetry/
|   |   |   |--- Commands/
|   |   |   |   |--- IngestTelemetryCommand.cs
|   |   |   |   |--- IngestTelemetryCommandHandler.cs
|   |   |   |--- Queries/
|   |   |   |   |--- GetLatestTelemetryQuery.cs
|   |   |   |   |--- GetLatestTelemetryQueryHandler.cs
|   |   |   |--- DTOs/
|   |   |   |   |--- TelemetryDto.cs
|   |   |--- MachineLearning/                   # ML related logic
|   |   |   |--- Commands/
|   |   |   |   |--- TriggerPredictionCommand.cs
|   |   |   |--- Queries/
|   |   |   |--- Services/                      # Interface to call Azure ML
|   |   |   |   |--- IAzureMlService.cs
|   |--- Interfaces/                            # Interfaces for Infrastructure (DB, MQTT, Email,...)
|   |   |--- Persistence/
|   |   |   |--- IApplicationDbContext.cs       # Interface for DbContext
|   |   |--- Communication/
|   |   |   |--- IMqttClientService.cs          # Interface for MQTT client
|   |   |   |--- IRealtimeNotifier.cs           # Interface for SignalR/realtime
|   |--- Common/                                # Mapping (AutoMapper), Validation (FluentValidation)
|   |   |--- Mappings/
|   |   |--- Behaviors/                         # (For MediatR pipeline)
|   |--- MyIoTPlatform.Application.csproj
|
|--- MyIoTPlatform.Infrastructure/              # Layer for specific technical implementations
|   |--- Persistence/                            # Data access implementation (EF Core)
|   |   |--- DbContexts/
|   |   |   |--- ApplicationDbContext.cs        # DbContext implementation with Azure SQL
|   |   |--- Repositories/                        # Implementation of Repository Interfaces
|   |   |   |--- DeviceRepository.cs
|   |   |   |--- TelemetryRepository.cs
|   |   |--- Migrations/                          # EF Core Migrations
|   |   |--- Configuration/                       # Entity Type Configuration (Fluent API)
|   |--- Communication/
|   |   |--- Mqtt/                                # MQTT Client implementation (e.g., using MQTTnet)
|   |   |   |--- MqttClientService.cs           # Listen/Send MQTT messages
|   |   |--- Realtime/                            # SignalR Hub implementation
|   |   |   |--- DashboardHub.cs
|   |   |   |--- RealtimeNotifier.cs
|   |--- MachineLearning/                        # Implementation for calling Azure ML Service
|   |   |--- AzureMlService.cs
|   |--- Services/                              # Other services (Email, File Storage,...)
|   |--- DependencyInjection.cs                 # Register Infrastructure services
|   |--- MyIoTPlatform.Infrastructure.csproj
|
|--- MyIoTPlatform.API/ (or WebAPI)             # API Layer (ASP.NET Core)
|   |--- Controllers/                            # API Endpoints
|   |   |--- AuthController.cs
|   |   |--- DashboardController.cs
|   |   |--- EnergyController.cs
|   |   |--- DevicesController.cs
|   |   |--- AnalyticsController.cs
|   |   |--- UsersController.cs
|   |   |--- SubscriptionController.cs
|   |   |--- SecurityController.cs
|   |   |--- NotificationsController.cs
|   |--- Hubs/                                  # SignalR Hub declarations (if not in Infrastructure)
|   |--- Middleware/                            # Custom Middleware (Error Handling, Logging)
|   |--- Program.cs                             # Application startup, configure services, pipeline
|   |--- appsettings.json
|   |--- appsettings.Development.json
|   |--- MyIoTPlatform.API.csproj
|
/tests
|--- MyIoTPlatform.Domain.Tests/
|   |--- DeviceTests.cs
|   |--- MyIoTPlatform.Domain.Tests.csproj
|--- MyIoTPlatform.Application.Tests/
|   |--- RegisterDeviceCommandHandlerTests.cs
|   |--- MyIoTPlatform.Application.Tests.csproj
|--- MyIoTPlatform.Infrastructure.Tests/
|   |--- MqttClientServiceTests.cs
|   |--- MyIoTPlatform.Infrastructure.Tests.csproj
|--- MyIoTPlatform.API.Tests/
|   |--- DevicesControllerTests.cs
|   |--- MyIoTPlatform.API.Tests.csproj
```