namespace MyIoTPlatform.Application.Features.Devices.DTOs
{
    public class DeviceSummaryDto
    {
        public required string Id { get; set; }
        public required string Name { get; set; }
        public required string Type { get; set; }
        public required string Status { get; set; }
    }
}