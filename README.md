![image](https://github.com/user-attachments/assets/e3b2c0de-d79c-4d75-9699-8a875c5ebb7e)

### SCROLL DOWN FOR MORE IMAGES
### SCROLL DOWN FOR MORE IMAGES
### SCROLL DOWN FOR MORE IMAGES

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


### TRANG CHỦ
![image](https://github.com/user-attachments/assets/c233f3f9-a899-49b7-a69c-71d9bd1f0b37)
![image](https://github.com/user-attachments/assets/0e40e6c3-a553-42bd-874c-127227d774a8)
![image](https://github.com/user-attachments/assets/7106bae9-ad4e-4ad6-8f83-8a5fa6a38e2a)
![image](https://github.com/user-attachments/assets/d57d46c2-31b1-4950-ba3c-a5447e5128ca)

### TRANG BLOGS
![image](https://github.com/user-attachments/assets/61c7d39d-99f9-4891-94dc-dff8abca55da)
![image](https://github.com/user-attachments/assets/7436cb7e-d644-4c9d-acad-6f4d1e2e24e4)
![image](https://github.com/user-attachments/assets/b6079ae3-f659-4f31-8457-8e20bf11fbf1)

### TRANG FAQs
![image](https://github.com/user-attachments/assets/f0cd3991-9424-466c-84fe-8014d0765602)
![image](https://github.com/user-attachments/assets/d1c18c31-3167-483c-96eb-55305eeaeab3)

### TRANG SIGNIN/SIGNUP
![image](https://github.com/user-attachments/assets/73fdf28c-b042-473b-8fb3-89f3757f5d18)
![image](https://github.com/user-attachments/assets/293d6a97-9a7f-4c1b-a305-050b4110d2f8)
![image](https://github.com/user-attachments/assets/43f83f2f-fba2-4781-8ce0-612f6f00d928)
![image](https://github.com/user-attachments/assets/f24191a0-063c-4068-a227-4e00957007c8)
![image](https://github.com/user-attachments/assets/cea4e697-0821-4018-b2f9-ec594b17a31d)

### TRANG DASHBOARD USER
![image](https://github.com/user-attachments/assets/7de88daa-e57e-4dcf-883b-d7dee09e6644)
![image](https://github.com/user-attachments/assets/5b184760-a09f-42d5-bc26-aedf184c6d34)
![image](https://github.com/user-attachments/assets/db636c8c-fb0c-4e90-a4ae-8aa84b8a4e0b)
![image](https://github.com/user-attachments/assets/1e8a70fc-e712-446f-99f8-3c4447229338)
![image](https://github.com/user-attachments/assets/cd028503-b85c-48c7-b89b-4b0f774a1f60)
![image](https://github.com/user-attachments/assets/df2b1a95-ddae-4a30-8174-2f26b3628342)
![image](https://github.com/user-attachments/assets/040ea2a2-b05e-483f-ad0d-5aa22134fbce)
![image](https://github.com/user-attachments/assets/7fe0badf-fd85-4cac-936e-fb8a1deefb51)
![image](https://github.com/user-attachments/assets/f478583e-c973-452d-b078-112131a3546a)


Updating Admin dashborad ........





















