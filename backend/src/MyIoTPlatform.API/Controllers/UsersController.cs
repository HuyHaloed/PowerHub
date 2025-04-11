using Microsoft.AspNetCore.Mvc;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        [HttpPut("profile")]
        public IActionResult UpdateUserProfile([FromBody] UpdateProfileRequest request)
        {
            // TODO: Implement logic to update user profile
            return Ok(new
            {
                id = 1,
                name = request.Name,
                email = request.Email,
                message = "Profile updated successfully."
            });
        }

        [HttpPut("password")]
        public IActionResult ChangePassword([FromBody] ChangePasswordRequest request)
        {
            // TODO: Implement logic to change password
            return Ok(new { message = "Password changed successfully." });
        }

        [HttpPut("notifications")]
        public IActionResult UpdateNotificationSettings([FromBody] UpdateNotificationSettingsRequest request)
        {
            // TODO: Implement logic to update notification settings
            return Ok(new { message = "Notification settings updated successfully." });
        }

        [HttpPut("preferences")]
        public IActionResult UpdateUserPreferences([FromBody] UpdateUserPreferencesRequest request)
        {
            // TODO: Implement logic to update user preferences
            return Ok(new { message = "User preferences updated successfully." });
        }

        [HttpDelete("account")]
        public IActionResult DeleteAccount([FromBody] DeleteAccountRequest request)
        {
            // TODO: Implement logic to delete user account
            return Ok(new { message = "Account deleted successfully." });
        }
    }

    // Define simple request models
    public class UpdateProfileRequest
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Language { get; set; }
        public string Avatar { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
        public string ConfirmPassword { get; set; }
    }

    public class UpdateNotificationSettingsRequest
    {
        public bool EmailNotifications { get; set; }
        public bool PushNotifications { get; set; }
        public bool HighUsageAlerts { get; set; }
        public bool DeviceStatusAlerts { get; set; }
        public bool WeeklyReports { get; set; }
        public bool MonthlyReports { get; set; }
    }

    public class UpdateUserPreferencesRequest
    {
        public string Theme { get; set; }
        public bool Animations { get; set; }
        public int EnergyGoal { get; set; }
        public int AlertThreshold { get; set; }
    }

    public class DeleteAccountRequest
    {
        public string Password { get; set; }
        public string ConfirmationText { get; set; }
    }
}
