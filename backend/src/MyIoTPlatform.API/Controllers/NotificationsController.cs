using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.API.Services;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;
        
        public NotificationsController(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllNotifications(int page = 1, int limit = 10, bool? read = null)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }
            
            var notifications = await _mongoDbService.GetNotificationsForUserAsync(userId, page, limit, read);
            var totalCount = await _mongoDbService.GetNotificationCountForUserAsync(userId);
            var unreadCount = await _mongoDbService.GetNotificationCountForUserAsync(userId, false);
            
            return Ok(new
            {
                total = totalCount,
                unread = unreadCount,
                notifications
            });
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkNotificationAsRead(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }
            
            await _mongoDbService.MarkNotificationAsReadAsync(id);
            
            return Ok(new { message = "Notification marked as read" });
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllNotificationsAsRead()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }
            
            await _mongoDbService.MarkAllNotificationsAsReadAsync(userId);
            
            return Ok(new { message = "All notifications marked as read" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }
            
            await _mongoDbService.DeleteNotificationAsync(id);
            
            return Ok(new { message = "Notification deleted" });
        }
    }
}