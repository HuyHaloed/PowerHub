// using System;
// using System.Security.Claims;
// using System.Threading.Tasks;
// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;
// using MyIoTPlatform.API.Models;
// using MyIoTPlatform.API.Services;

// namespace MyIoTPlatform.API.Controllers
// {
//     [ApiController]
//     [Route("api/security")]
//     [Authorize]
//     public class SecurityController : ControllerBase
//     {
//         private readonly UserService _userService;
//         private readonly MongoDbService _mongoDbService;
        
//         public SecurityController(UserService userService, MongoDbService mongoDbService)
//         {
//             _userService = userService;
//             _mongoDbService = mongoDbService;
//         }

//         [HttpPost("2fa/enable")]
//         public async Task<IActionResult> EnableTwoFactorAuthentication()
//         {
//             var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//             if (string.IsNullOrEmpty(userId))
//             {
//                 return Unauthorized(new { message = "User not authenticated" });
//             }
            
//             var secret = await _userService.EnableTwoFactorAuthenticationAsync(userId);
            
//             // In a real implementation, you would generate a QR code with the secret
//             // For demonstration purposes, we just return the secret
//             return Ok(new
//             {
//                 qrCode = "qr_code_url", // This would be generated based on the secret
//                 secret
//             });
//         }

//         [HttpPost("2fa/verify")]
//         public async Task<IActionResult> VerifyTwoFactorAuthentication([FromBody] Verify2FARequest request)
//         {
//             var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//             if (string.IsNullOrEmpty(userId))
//             {
//                 return Unauthorized(new { message = "User not authenticated" });
//             }
            
//             var user = await _userService.GetUserByIdAsync(userId);
//             if (user == null)
//             {
//                 return NotFound(new { message = "User not found" });
//             }
            
//             var isValid = _userService.VerifyTwoFactorAuthenticationCode(user.TwoFactorSecret, request.Code);
//             if (!isValid)
//             {
//                 return BadRequest(new { message = "Invalid 2FA code" });
//             }
            
//             return Ok(new { message = "2FA code verified successfully" });
//         }

//         [HttpPost("2fa/disable")]
//         public async Task<IActionResult> DisableTwoFactorAuthentication([FromBody] Disable2FARequest request)
//         {
//             var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//             if (string.IsNullOrEmpty(userId))
//             {
//                 return Unauthorized(new { message = "User not authenticated" });
//             }
            
//             var user = await _userService.GetUserByIdAsync(userId);
//             if (user == null)
//             {
//                 return NotFound(new { message = "User not found" });
//             }
            
//             await _userService.DisableTwoFactorAuthenticationAsync(userId);
            
//             return Ok(new { message = "2FA disabled successfully" });
//         }

//         [HttpGet("sessions")]
//         public async Task<IActionResult> GetActiveSessions()
//         {
//             var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//             if (string.IsNullOrEmpty(userId))
//             {
//                 return Unauthorized(new { message = "User not authenticated" });
//             }
            
//             var sessions = await _mongoDbService.GetActiveSessionsForUserAsync(userId);
            
//             return Ok(sessions);
//         }

//         [HttpDelete("sessions/{id}")]
//         public async Task<IActionResult> RevokeSession(string id)
//         {
//             var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//             if (string.IsNullOrEmpty(userId))
//             {
//                 return Unauthorized(new { message = "User not authenticated" });
//             }
            
//             await _mongoDbService.RevokeSessionAsync(id);
            
//             return Ok(new { message = "Session revoked successfully" });
//         }

//         [HttpPost("data-export")]
//         public async Task<IActionResult> ExportPersonalData()
//         {
//             var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//             if (string.IsNullOrEmpty(userId))
//             {
//                 return Unauthorized(new { message = "User not authenticated" });
//             }
            
//             var user = await _userService.GetUserByIdAsync(userId);
//             if (user == null)
//             {
//                 return NotFound(new { message = "User not found" });
//             }
//             return Ok(new { message = "Personal data export initiated. You will receive an email with the download link." });
//         }
//     }
// }