using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.API.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Security.Claims;

namespace MyIoTPlatform.API.Controllers
{
    /// <summary>
    /// Handles operations related to the dashboard.
    /// </summary>
    [ApiController]
    [Route("api/dashboard")]
    [Authorize] // Yêu cầu đăng nhập để truy cập dashboard
    public class DashboardController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly DashboardService _dashboardService;

        public DashboardController(UserService userService, DashboardService dashboardService)
        {
            _userService = userService;
            _dashboardService = dashboardService;
        }

        /// <summary>
        /// Retrieves the overview data for the dashboard.
        /// </summary>
        /// <returns>Dashboard data including user info, stats, and alerts.</returns>
        [HttpGet]
        public async Task<IActionResult> GetDashboardData()
        {
            // Lấy ID của người dùng hiện tại từ token
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Lấy thông tin người dùng
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Lấy thống kê và cảnh báo cho người dùng cụ thể
            var stats = await _dashboardService.GetStatsForUserAsync(userId);
            var alerts = await _dashboardService.GetAlertsForUserAsync(userId);

            // Tạo response
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
                alerts = alerts
            };

            return Ok(response);
        }

        /// <summary>
        /// Retrieves quick statistics for the dashboard.
        /// </summary>
        /// <returns>Quick stats including total and active devices.</returns>
        [HttpGet("quick-stats")]
        public async Task<IActionResult> GetQuickStats()
        {
            // Lấy ID của người dùng hiện tại từ token
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Lấy thống kê nhanh cho người dùng cụ thể
            var quickStats = await _dashboardService.GetQuickStatsForUserAsync(userId);

            return Ok(quickStats);
        }

        /// <summary>
        /// Retrieves unread alerts for the dashboard.
        /// </summary>
        /// <returns>List of unread alerts.</returns>
        [HttpGet("alerts/unread")]
        public async Task<IActionResult> GetUnreadAlerts()
        {
            // Lấy ID của người dùng hiện tại từ token
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Lấy cảnh báo chưa đọc cho người dùng cụ thể
            var unreadAlerts = await _dashboardService.GetUnreadAlertsForUserAsync(userId);

            return Ok(unreadAlerts);
        }

        /// <summary>
        /// Marks an alert as read.
        /// </summary>
        /// <param name="id">The ID of the alert to mark as read.</param>
        /// <returns>Status 200 OK.</returns>
        [HttpPut("alerts/{id}/read")]
        public async Task<IActionResult> MarkAlertAsRead(string id)
        {
            // Lấy ID của người dùng hiện tại từ token
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Đánh dấu cảnh báo đã đọc
            var success = await _dashboardService.MarkAlertAsReadAsync(id, userId);
            if (!success)
            {
                return NotFound(new { message = "Alert not found or you don't have permission" });
            }

            return Ok(new { message = "Alert marked as read" });
        }
    }
}