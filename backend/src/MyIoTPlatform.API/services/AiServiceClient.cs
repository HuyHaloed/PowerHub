namespace MyIoTPlatform.API.Services;
using MyIoTPlatform.Application.DTOs;
public interface IAiService
{
    Task<PredictionResult> PredictAsync(PredictRequest req);
    Task<VoiceResult> InterpretVoiceAsync(VoiceRequest req);
}

public class AiServiceClient : IAiService
{
    private readonly HttpClient _http;
    public AiServiceClient(IHttpClientFactory factory)
        => _http = factory.CreateClient("AiService");

    public async Task<PredictionResult> PredictAsync(PredictRequest req)
    {
        var resp = await _http.PostAsJsonAsync("/predict", req);
        return await resp.Content.ReadFromJsonAsync<PredictionResult>();
    }

    public async Task<VoiceResult> InterpretVoiceAsync(VoiceRequest req)
    {
        var resp = await _http.PostAsJsonAsync("/voice", req);
        return await resp.Content.ReadFromJsonAsync<VoiceResult>();
    }
}
