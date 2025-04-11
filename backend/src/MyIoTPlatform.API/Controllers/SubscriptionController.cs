using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/subscription")]
    public class SubscriptionController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetSubscriptionDetails()
        {
            // TODO: Implement logic to retrieve subscription details
            return Ok(new
            {
                plan = "Premium",
                validUntil = "2024-12-31",
                features = new List<string> { "Unlimited Devices", "Advanced Analytics" },
                price = 99.99,
                billingCycle = "Monthly",
                paymentMethod = new
                {
                    type = "Credit Card",
                    lastFour = "1234",
                    expiryDate = "12/24"
                },
                history = new List<object>
                {
                    new { date = "2023-10-20", amount = 99.99, status = "Paid" }
                }
            });
        }

        [HttpPost("upgrade")]
        public IActionResult UpgradeSubscription([FromBody] UpgradeSubscriptionRequest request)
        {
            // TODO: Implement logic to upgrade subscription
            return Ok(new { message = "Subscription upgraded successfully." });
        }

        [HttpPost("payment-methods")]
        public IActionResult AddPaymentMethod([FromBody] AddPaymentMethodRequest request)
        {
            // TODO: Implement logic to add payment method
            return Ok(new { message = "Payment method added successfully." });
        }

        [HttpGet("payments")]
        public IActionResult GetPaymentHistory()
        {
            // TODO: Implement logic to get payment history
            return Ok(new List<object>
            {
                new { id = "1", date = "2023-11-20", amount = 99.99, description = "Monthly Subscription", status = "Paid" }
            });
        }
    }

    // Define simple request models
    public class UpgradeSubscriptionRequest
    {
        public string Plan { get; set; }
        public string PaymentMethodId { get; set; }
    }

    public class AddPaymentMethodRequest
    {
        public string Type { get; set; }
        public string CardNumber { get; set; }
        public string ExpiryDate { get; set; }
        public string Cvc { get; set; }
        public string CardholderName { get; set; }
    }
}
