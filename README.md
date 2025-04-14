# Project Structure

The project is organized as follows:

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

# Usage Instructions

1. **Setup**:
   - Clone the repository.
   - Navigate to the project directory.
   - Install necessary dependencies for both backend and frontend.

2. **Backend**:
   - Open the solution file `MyIoTPlatformSolution.sln` in Visual Studio.
   - Build the solution to restore NuGet packages.
   - Run the project to start the backend server.

3. **Frontend**:
   - Navigate to the `frontend` directory.
   - Run `npm install` to install dependencies.
   - Use `npm run dev` to start the development server.

4. **Testing**:
   - Backend tests are located in the `*.Tests` projects under the `backend` directory.
   - Frontend tests can be run using `npm test` in the `frontend` directory.

5. **Deployment**:
   - Follow the deployment instructions specific to your hosting environment.


# Task must do
To implement the requested features, we need to break them down into smaller tasks and identify the files or components that need to be updated. Here's a high-level plan:

### 1. **Real-time Notifications**
   - Use SignalR (already present in the backend under `Hubs/`) to send notifications to users when specific events occur.
   - Update the backend to trigger notifications for relevant events.
   - Update the frontend to listen for and display notifications.

### 2. **Live Chat**
   - Implement a SignalR hub for chat functionality in the backend.
   - Create frontend components for the chat interface.
   - Establish real-time communication between users via SignalR.

### 3. **Data Streaming**
   - Use SignalR to stream IoT data updates from the backend to the frontend.
   - Update the backend to push IoT data changes to connected clients.
   - Update the frontend to display real-time IoT data updates.

### 4. **Collaboration Tools**
   - Implement collaborative editing or shared dashboards using SignalR.
   - Update the backend to manage shared state and broadcast updates.
   - Update the frontend to reflect real-time changes in shared dashboards or documents.

To implement the requested features, we can break them down into smaller tasks and identify the files or areas in the workspace that need to be modified:

### 1. **Real-time Notifications**
   - Use SignalR (already present in the `Hubs/` folder) for real-time communication.
   - Add a notification hub to handle sending notifications to users.
   - Update the frontend to listen for notifications and display them.

### 2. **Live Chat**
   - Create a SignalR hub for chat functionality.
   - Add a chat interface in the frontend under `components/` or `pages/`.
   - Implement backend logic to handle chat messages.

### 3. **Data Streaming**
   - Use SignalR to stream IoT data updates to the frontend.
   - Update the backend to push IoT data to connected clients.
   - Modify the frontend to display real-time IoT data updates.

### 4. **Collaboration Tools**
   - Implement collaborative editing or shared dashboards using SignalR.
   - Add backend logic to synchronize data between users.
   - Update the frontend to support collaborative features.

start by implementing the **Real-time Notifications** feature.To implement the requested features, we can break them down into smaller tasks and identify the files or areas in the workspace that need to be modified:

### 1. **Real-time Notifications**
   - Use SignalR (already present in the `Hubs/` folder) to send notifications to users when specific events occur.
   - Backend: Update or create a SignalR hub in `MyIoTPlatform.API/Hubs/`.
   - Frontend: Add a notification system in components.

### 2. **Live Chat**
   - Backend: Create a SignalR hub for chat functionality in `MyIoTPlatform.API/Hubs/`.
   - Frontend: Add a chat UI in components.

### 3. **Data Streaming**
   - Backend: Use SignalR to stream IoT data updates to the frontend in real-time.
   - Frontend: Update the `DashboardIOT/` component in components to display real-time data.

### 4. **Collaboration Tools**
   - Backend: Implement APIs or SignalR hubs for collaborative editing or shared dashboards.
   - Frontend: Add collaboration features in components.