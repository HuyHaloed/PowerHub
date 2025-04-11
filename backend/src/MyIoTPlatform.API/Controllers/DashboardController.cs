using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    public class DashboardController : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetDashboardData()
        {
            // TODO: Implement logic to retrieve dashboard data
            // For now, return a placeholder response
            return Ok(new
            {
                user = new
                {
                    id = 1,
                    name = "Sample User",
                    email = "user@example.com",
                    avatar = "avatar_url",
                    subscription = new
                    {
                        plan = "basic",
                        validUntil = "2024-12-31"
                    },
                    preferences = new
                    {
                        theme = "light",
                        notifications = true,
                        energyGoal = 1000
                    }
                },
                stats = new List<object>
                {
                    new { id = 1, title = "Total Consumption", value = 5000, unit = "kWh", change = 100, changeType = "increase" },
                    new { id = 2, title = "Average Daily Use", value = 150, unit = "kWh", change = 5, changeType = "decrease" }
                },
                alerts = new List<object>
                {
                    new { id = 1, title = "High Consumption Alert", message = "Energy consumption exceeded the daily goal.", severity = "warning", read = false, date = "2023-11-20" },
                    new { id = 2, title = "Device Offline", message = "Device XYZ is offline.", severity = "error", read = false, date = "2023-11-20" }
                }
            });
        }

        [HttpGet("quick-stats")]
        public async Task<IActionResult> GetQuickStats()
        {
            // TODO: Implement logic to retrieve quick stats
            // For now, return a placeholder response
            return Ok(new List<object>
            {
                new { id = 1, title = "Total Devices", value = 100, unit = "", change = 10, changeType = "increase", icon = "devices" },
                new { id = 2, title = "Active Devices", value = 80, unit = "", change = 5, changeType = "increase", icon = "active_devices" }
            });
        }

        [HttpGet("alerts/unread")]
        public async Task<IActionResult> GetUnreadAlerts()
        {
            // TODO: Implement logic to retrieve unread alerts
            // For now, return a placeholder response
            return Ok(new List<object>
            {
                new { id = 1, title = "High Consumption Alert", message = "Energy consumption exceeded the daily goal.", severity = "warning", date = "2023-11-20" },
                new { id = 2, title = "Device Offline", message = "Device XYZ is offline.", severity = "error", date = "2023-11-20" }
            });
        }

        [HttpPut("alerts/{id}/read")]
        public IActionResult MarkAlertAsRead(int id)
        {
            // TODO: Implement logic to mark an alert as read
            return Ok();
        }
    }
}
