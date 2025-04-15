using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace MyIoTPlatform.Infrastructure.Communication.Realtime
{
    /// <summary>
    /// SignalR hub for real-time dashboard updates.
    /// </summary>
    public class DashboardHub : Hub
    {
        // Called when a client connects
        public override async Task OnConnectedAsync()
        {
            // Custom logic for new connections (e.g., logging, group management)
            await base.OnConnectedAsync();
        }

        // Called when a client disconnects
        public override async Task OnDisconnectedAsync(Exception exception)
        {
            // Custom logic for disconnects
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Example: Client can call this to notify the server of a device status change.
        /// </summary>
        public async Task SendDeviceStatus(string deviceId, string status)
        {
            // Broadcast to all clients (or use Groups for more control)
            await Clients.All.SendAsync("ReceiveDeviceStatus", deviceId, status);
        }

        // Add more hub methods as needed for your IoT use cases
    }
}