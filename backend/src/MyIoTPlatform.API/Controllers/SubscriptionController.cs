using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace MyIoTPlatform.API.Controllers
{
    /// <summary>
    /// Handles operations related to user subscriptions.
    /// </summary>
    [ApiController]
    [Route("api/subscription")]
    public class SubscriptionController : ControllerBase
    {
        /// <summary>
        /// Retrieves the details of the user's current subscription.
        /// </summary>
        /// <returns>Subscription details including plan, validity, features, and payment history.</returns>
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

        /// <summary>
        /// Upgrades the user's subscription to a new plan.
        /// </summary>
        /// <param name="request">The request containing the new plan and payment method details.</param>
        /// <returns>A success message if the subscription is upgraded successfully.</returns>
        [HttpPost("upgrade")]
        public IActionResult UpgradeSubscription([FromBody] UpgradeSubscriptionRequest request)
        {
            // TODO: Implement logic to upgrade subscription
            return Ok(new { message = "Subscription upgraded successfully." });
        }

        /// <summary>
        /// Adds a new payment method for the user.
        /// </summary>
        /// <param name="request">The request containing payment method details.</param>
        /// <returns>A success message if the payment method is added successfully.</returns>
        [HttpPost("payment-methods")]
        public IActionResult AddPaymentMethod([FromBody] AddPaymentMethodRequest request)
        {
            // TODO: Implement logic to add payment method
            return Ok(new { message = "Payment method added successfully." });
        }

        /// <summary>
        /// Retrieves the user's payment history.
        /// </summary>
        /// <returns>A list of payment transactions.</returns>
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

    /// <summary>
    /// Request model for upgrading a subscription.
    /// </summary>
    public class UpgradeSubscriptionRequest
    {
        /// <summary>
        /// The new subscription plan to upgrade to.
        /// </summary>
        public required string Plan { get; set; }

        /// <summary>
        /// The ID of the payment method to use for the upgrade.
        /// </summary>
        public required string PaymentMethodId { get; set; }
    }

    /// <summary>
    /// Request model for adding a new payment method.
    /// </summary>
    public class AddPaymentMethodRequest
    {
        /// <summary>
        /// The type of payment method (e.g., Credit Card, PayPal).
        /// </summary>
        public required string Type { get; set; }

        /// <summary>
        /// The card number for the payment method.
        /// </summary>
        public required string CardNumber { get; set; }

        /// <summary>
        /// The expiry date of the card.
        /// </summary>
        public required string ExpiryDate { get; set; }

        /// <summary>
        /// The CVC code of the card.
        /// </summary>
        public required string Cvc { get; set; }

        /// <summary>
        /// The name of the cardholder.
        /// </summary>
        public required string CardholderName { get; set; }
    }
}
