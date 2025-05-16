// using Microsoft.AspNetCore.SignalR;
// using System.Threading.Tasks;

// namespace MyIoTPlatform.API.Controllers
// {
//     public class DeviceHub : Hub
//     {
//         private readonly ILogger<DeviceHub> _logger;

//         public DeviceHub(ILogger<DeviceHub> logger)
//         {
//             _logger = logger;
//         }

//         public override async Task OnConnectedAsync()
//         {
//             _logger.LogInformation($"Client connected: {Context.ConnectionId}");
//             await base.OnConnectedAsync();
//         }

//         public override async Task OnDisconnectedAsync(Exception exception)
//         {
//             _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
//             await base.OnDisconnectedAsync(exception);
//         }

//         // Method to control device from frontend
//         public async Task ControlDevice(string deviceId, string deviceName, string status)
//         {
//             _logger.LogInformation($"Client {Context.ConnectionId} requested device control: {deviceName} - {status}");
            
//             // Broadcast to all clients
//             await Clients.All.SendAsync("DeviceStateChanged", new
//             {
//                 DeviceId = deviceId,
//                 DeviceName = deviceName,
//                 Status = status,
//                 Timestamp = DateTime.UtcNow
//             });
//         }
//     }
// }