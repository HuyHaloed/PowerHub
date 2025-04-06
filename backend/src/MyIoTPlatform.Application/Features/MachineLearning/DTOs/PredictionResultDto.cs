namespace MyIoTPlatform.Application.Features.MachineLearning.DTOs
{
    public class PredictionResultDto
    {
        public int DeviceId { get; set; }
        public double PredictedValue { get; set; }

        public string Result { get; set; } = string.Empty;
    }
}
