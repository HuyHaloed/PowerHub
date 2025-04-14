using MyIoTPlatform.Domain.Entities;
using NUnit.Framework;
using System;

namespace MyIoTPlatform.Domain.Tests
{
    public class RuleTests
    {
        [Test]
        public void CreateRule_ValidData_Success()
        {
            // Arrange
            var rule = new Rule
            {
                Id = Guid.NewGuid(),
                Name = "Temperature Check",
                Condition = "temperature > 30",
                Action = "Send Alert",
                CreatedAt = DateTime.UtcNow
            };

            // Act & Assert
            Assert.IsNotNull(rule);
            Assert.AreEqual("Temperature Check", rule.Name);
            Assert.AreEqual("temperature > 30", rule.Condition);
        }
    }
}