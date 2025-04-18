using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.API.Services;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly DashboardService _dashboardService;
        private readonly MongoDbService _mongoDbService;

        public DashboardController(UserService userService, DashboardService dashboardService, MongoDbService mongoDbService)
        {
            _userService = userService;
            _dashboardService = dashboardService;
            _mongoDbService = mongoDbService;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboardData()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var stats = await _dashboardService.GetStatsForUserAsync(userId);
            var alerts = await _dashboardService.GetAlertsForUserAsync(userId);
            var devices = await _mongoDbService.GetDevicesByUserIdAsync(userId);

            var response = new
            {
                user = new
                {
                    id = user.Id,
                    name = user.Name,
                    email = user.Email,
                    avatar = user.Avatar,
                    subscription = user.Subscription,
                    preferences = user.Preferences
                },
                stats = stats,
                alerts = alerts,
                devices = devices
            };

            return Ok(response);
        }

        [HttpGet("quick-stats")]
        public async Task<IActionResult> GetQuickStats()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var quickStats = await _dashboardService.GetQuickStatsForUserAsync(userId);

            return Ok(quickStats);
        }

        [HttpGet("alerts/unread")]
        public async Task<IActionResult> GetUnreadAlerts()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var unreadAlerts = await _dashboardService.GetUnreadAlertsForUserAsync(userId);

            return Ok(unreadAlerts);
        }

        [HttpPut("alerts/{id}/read")]
        public async Task<IActionResult> MarkAlertAsRead(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var success = await _dashboardService.MarkAlertAsReadAsync(id, userId);
            if (!success)
            {
                return NotFound(new { message = "Alert not found or you don't have permission" });
            }

            return Ok(new { message = "Alert marked as read" });
        }
    }
}