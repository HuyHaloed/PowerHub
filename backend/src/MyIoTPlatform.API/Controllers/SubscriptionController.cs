// using System;
// using System.Collections.Generic;
// using System.Security.Claims;
// using System.Threading.Tasks;
// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;
// using MyIoTPlatform.API.Models;
// using MyIoTPlatform.API.Services;

// namespace MyIoTPlatform.API.Controllers
// {
//     [ApiController]
//     [Route("api/subscription")]
//     [Authorize]
//     public class SubscriptionController : ControllerBase
//     {
//         private readonly UserService _userService;
        
//         public SubscriptionController(UserService userService)
//         {
//             _userService = userService;
//         }

//         [HttpGet]
//         public async Task<IActionResult> GetSubscriptionDetails()
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
            
//             return Ok(new
//             {
//                 plan = user.Subscription.Plan,
//                 validUntil = user.Subscription.ValidUntil,
//                 features = GetPlanFeatures(user.Subscription.Plan),
//                 price = GetPlanPrice(user.Subscription.Plan),
//                 billingCycle = "Monthly",
//                 paymentMethod = user.Subscription.PaymentMethod,
//                 history = user.Subscription.PaymentHistory
//             });
//         }

//         [HttpPost("upgrade")]
//         public async Task<IActionResult> UpgradeSubscription([FromBody] UpgradeSubscriptionRequest request)
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
//             user.Subscription.Plan = request.Plan;
//             user.Subscription.ValidUntil = DateTime.UtcNow.AddYears(1);
//             var payment = new PaymentHistory
//             {
//                 Date = DateTime.UtcNow,
//                 Amount = GetPlanPrice(request.Plan),
//                 Description = $"Upgrade to {request.Plan} plan",
//                 Status = "Paid"
//             };
            
//             user.Subscription.PaymentHistory.Add(payment);
            
//             await _userService.UpdateUserSubscriptionAsync(userId, user.Subscription);
            
//             return Ok(new { message = "Subscription upgraded successfully." });
//         }

//         [HttpPost("payment-methods")]
//         public async Task<IActionResult> AddPaymentMethod([FromBody] AddPaymentMethodRequest request)
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
//             var paymentMethod = new PaymentMethod
//             {
//                 Type = request.Type,
//                 LastFour = request.CardNumber.Substring(request.CardNumber.Length - 4),
//                 ExpiryDate = request.ExpiryDate,
//                 CardholderName = request.CardholderName
//             };
            
//             await _userService.UpdatePaymentMethodAsync(userId, paymentMethod);
            
//             return Ok(new { message = "Payment method added successfully." });
//         }

//         [HttpGet("payments")]
//         public async Task<IActionResult> GetPaymentHistory()
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
            
//             return Ok(user.Subscription.PaymentHistory);
//         }
        
//         #region Helper Methods
//         private List<string> GetPlanFeatures(string plan)
//         {
//             switch (plan.ToLower())
//             {
//                 case "premium":
//                     return new List<string> 
//                     { 
//                         "Unlimited Devices", 
//                         "Advanced Analytics", 
//                         "API Access", 
//                         "Priority Support" 
//                     };
//                 case "basic":
//                     return new List<string> 
//                     { 
//                         "Up to 10 Devices", 
//                         "Basic Analytics" 
//                     };
//                 default:
//                     return new List<string> 
//                     { 
//                         "Up to 3 Devices" 
//                     };
//             }
//         }
        
//         private double GetPlanPrice(string plan)
//         {
//             switch (plan.ToLower())
//             {
//                 case "premium":
//                     return 99.99;
//                 case "basic":
//                     return 49.99;
//                 default:
//                     return 0;
//             }
//         }
//         #endregion
//     }
// }