using MyIoTPlatform.Application.Features.MachineLearning.Services;
using Newtonsoft.Json;
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace MyIoTPlatform.Infrastructure.Services
{
    public class AzureMlService : IAzureMlService
    {
        private readonly HttpClient _httpClient;
        private const string AzureMLApiUrl = "https://your-azure-ml-endpoint.com/predict";

        public AzureMlService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string> PredictAsync(int deviceId, double temperature, double humidity, double lightIntensity)
        {
            var requestData = new
            {
                deviceId,
                temperature,
                humidity,
                lightIntensity
            };

            var json = JsonConvert.SerializeObject(requestData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(AzureMLApiUrl, content);

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception("Azure ML prediction failed.");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            return responseContent;
        }
    }
}
