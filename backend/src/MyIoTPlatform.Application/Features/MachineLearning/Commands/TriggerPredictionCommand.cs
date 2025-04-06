using MediatR;

namespace MyIoTPlatform.Application.Features.MachineLearning.Commands
{
    public class TriggerPredictionCommand : IRequest<string>
    {
        public int DeviceId { get; set; }
        public double Temperature { get; set; }
        public double Humidity { get; set; }
        public double LightIntensity { get; set; }

        public TriggerPredictionCommand(int deviceId, double temperature, double humidity, double lightIntensity)
        {
            DeviceId = deviceId;
            Temperature = temperature;
            Humidity = humidity;
            LightIntensity = lightIntensity;
        }
    }
}