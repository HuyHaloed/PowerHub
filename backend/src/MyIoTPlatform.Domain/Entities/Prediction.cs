// MyIoTPlatform.Domain/Entities/Prediction.cs
using System;

namespace MyIoTPlatform.Domain.Entities
{
    public class Prediction
    {
        public int Id { get; set; }
        public Guid DeviceId { get; set; }
        public string? Result { get; set; }
        public DateTime CreatedDate { get; set; }

        // Các thuộc tính khác liên quan đến dự đoán
    }
}