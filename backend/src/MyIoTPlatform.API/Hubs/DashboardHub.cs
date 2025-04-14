using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace MyIoTPlatform.API.Hubs
{
    /// <summary>
    /// SignalR hub for real-time communication with the dashboard.
    /// </summary>
    public class DashboardHub : Hub
    {
        /// <summary>
        /// Sends a message to all connected clients.
        /// </summary>
        /// <param name="message">The message to broadcast.</param>
        public async Task BroadcastMessage(string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", message);
        }

        /// <summary>
        /// Notifies all clients about an update in energy consumption.
        /// </summary>
        /// <param name="data">The energy consumption data to broadcast.</param>
        public async Task NotifyEnergyUpdate(object data)
        {
            await Clients.All.SendAsync("EnergyUpdate", data);
        }
    }
}