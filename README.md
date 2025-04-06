
```
MyIoTPlatformSolution.sln
/src
|
|--- MyIoTPlatform.Domain/                 # Lớp lõi, không phụ thuộc lớp khác
|    |--- Entities/                       # Các đối tượng nghiệp vụ chính
|    |    |--- Device.cs
|    |    |--- TelemetryData.cs
|    |    |--- DeviceType.cs
|    |    |--- User.cs
|    |    |--- Alarm.cs
|    |--- Enums/                          # Các kiểu enum dùng chung
|    |    |--- DeviceStatus.cs
|    |    |--- AlarmSeverity.cs
|    |--- Interfaces/                     # Interfaces cho Repositories hoặc Domain Services
|    |    |--- Repositories/
|    |    |    |--- IDeviceRepository.cs
|    |    |    |--- ITelemetryRepository.cs
|    |    |--- Services/
|    |--- Common/                         # Các lớp hoặc cấu trúc cơ sở dùng chung trong Domain
|    |--- Exceptions/                     # Các ngoại lệ nghiệp vụ tùy chỉnh
|    |--- MyIoTPlatform.Domain.csproj
|
|--- MyIoTPlatform.Application/            # Lớp Logic nghiệp vụ, Use Cases
|    |--- Features/                       # Tổ chức theo nghiệp vụ (Vertical Slices)
|    |    |--- Devices/
|    |    |    |--- Commands/             # Lệnh (Create, Update, Delete)
|    |    |    |    |--- RegisterDeviceCommand.cs
|    |    |    |    |--- RegisterDeviceCommandHandler.cs
|    |    |    |--- Queries/              # Truy vấn (Get)
|    |    |    |    |--- GetDeviceByIdQuery.cs
|    |    |    |    |--- GetDeviceByIdQueryHandler.cs
|    |    |    |--- DTOs/                 # Data Transfer Objects cho nghiệp vụ Device
|    |    |    |    |--- DeviceDto.cs
|    |    |--- Telemetry/
|    |    |    |--- Commands/
|    |    |    |    |--- IngestTelemetryCommand.cs
|    |    |    |    |--- IngestTelemetryCommandHandler.cs
|    |    |    |--- Queries/
|    |    |    |    |--- GetLatestTelemetryQuery.cs
|    |    |    |    |--- GetLatestTelemetryQueryHandler.cs
|    |    |    |--- DTOs/
|    |    |    |    |--- TelemetryDto.cs
|    |    |--- MachineLearning/           # Logic liên quan ML
|    |    |    |--- Commands/
|    |    |    |    |--- TriggerPredictionCommand.cs
|    |    |    |--- Queries/
|    |    |    |--- Services/             # Interface gọi ra Azure ML
|    |    |    |    |--- IAzureMlService.cs
|    |--- Interfaces/                     # Các interface cho Infrastructure (DB, MQTT, Email,...)
|    |    |--- Persistence/
|    |    |    |--- IApplicationDbContext.cs # Interface cho DbContext
|    |    |--- Communication/
|    |    |    |--- IMqttClientService.cs   # Interface cho MQTT client
|    |    |    |--- IRealtimeNotifier.cs    # Interface cho SignalR/realtime
|    |--- Common/                         # Mapping (AutoMapper), Validation (FluentValidation)
|    |    |--- Mappings/
|    |    |--- Behaviors/                 # (Cho MediatR pipeline)
|    |--- MyIoTPlatform.Application.csproj
|
|--- MyIoTPlatform.Infrastructure/         # Lớp triển khai chi tiết kỹ thuật
|    |--- Persistence/                    # Triển khai truy cập dữ liệu (EF Core)
|    |    |--- DbContexts/
|    |    |    |--- ApplicationDbContext.cs # Triển khai DbContext với Azure SQL
|    |    |--- Repositories/               # Triển khai các Repository Interface
|    |    |    |--- DeviceRepository.cs
|    |    |    |--- TelemetryRepository.cs
|    |    |--- Migrations/                 # EF Core Migrations
|    |    |--- Configuration/              # Cấu hình Entity Type (Fluent API)
|    |--- Communication/
|    |    |--- Mqtt/                       # Triển khai MQTT Client (ví dụ: dùng MQTTnet)
|    |    |    |--- MqttClientService.cs    # Lắng nghe/Gửi message MQTT
|    |    |--- Realtime/                   # Triển khai SignalR Hub
|    |    |    |--- DashboardHub.cs
|    |    |    |--- RealtimeNotifier.cs
|    |--- MachineLearning/                 # Triển khai gọi Azure ML Service
|    |    |--- AzureMlService.cs
|    |--- Services/                       # Các dịch vụ khác (Email, File Storage,...)
|    |--- DependencyInjection.cs          # Đăng ký các services của Infrastructure
|    |--- MyIoTPlatform.Infrastructure.csproj
|
|--- MyIoTPlatform.API/ (hoặc WebAPI)      # Lớp API (ASP.NET Core)
|    |--- Controllers/                    # API Endpoints
|    |    |--- DevicesController.cs
|    |    |--- TelemetryController.cs
|    |    |--- AdminController.cs
|    |--- Hubs/                           # Khai báo SignalR Hubs (nếu không để ở Infrastructure)
|    |--- Middleware/                     # Custom Middleware (Error Handling, Logging)
|    |--- Program.cs                      # Khởi tạo ứng dụng, cấu hình services, pipeline
|    |--- appsettings.json
|    |--- appsettings.Development.json
|    |--- MyIoTPlatform.API.csproj
|
/tests
|--- MyIoTPlatform.Domain.Tests/
|--- MyIoTPlatform.Application.Tests/
|--- MyIoTPlatform.Infrastructure.Tests/
|--- MyIoTPlatform.API.Tests/
```