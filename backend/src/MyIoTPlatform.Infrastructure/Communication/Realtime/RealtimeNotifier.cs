using Microsoft.AspNetCore.SignalR;
using MyIoTPlatform.Application.Features.Telemetry.DTOs;
using MyIoTPlatform.Application.Interfaces.Communication;

namespace MyIoTPlatform.Infrastructure.Communication.Realtime
{
    /// <summary>
    /// Service for sending real-time notifications to connected dashboard clients.
    /// </summary>
    public class RealtimeNotifier : IRealtimeNotifier
    {
        private readonly IHubContext<DashboardHub> _hubContext;

        public RealtimeNotifier(IHubContext<DashboardHub> hubContext)
        {
            _hubContext = hubContext;
        }

        /// <summary>
        /// Sends a generic notification to all connected clients.
        /// </summary>
        public async Task NotifyAllAsync(string eventName, object payload)
        {
            await _hubContext.Clients.All.SendAsync(eventName, payload);
        }

        /// <summary>
        /// Sends a notification to a specific user.
        /// </summary>
        public async Task NotifyUserAsync(string userId, string eventName, object payload)
        {
            await _hubContext.Clients.User(userId).SendAsync(eventName, payload);
        }

        // Extend with more methods for device, telemetry, or alarm notifications as needed.
        public async Task NotifyTelemetryUpdateAsync(TelemetryDto telemetry)
        {
            await _hubContext.Clients.All.SendAsync("TelemetryUpdated", telemetry);
        }
    }
}