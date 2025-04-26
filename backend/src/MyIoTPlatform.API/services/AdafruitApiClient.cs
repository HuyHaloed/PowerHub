using MyIoTPlatform.Application.Interfaces.Communication; 
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

public class AdafruitApiClient : IAdafruitApiClient
{
    private readonly HttpClient _http;
    private readonly string _username;

    public AdafruitApiClient(HttpClient http, IConfiguration config)
    {
        _http = http;
        _username = config["Adafruit:Username"]!;
    }

    public async Task PublishAsync(string feedKey, object data)
    {
        // POST /api/v2/{username}/feeds/{feedKey}/data
        var endpoint = $"{_username}/feeds/{feedKey}/data";
        var response = await _http.PostAsJsonAsync(endpoint, data);
        response.EnsureSuccessStatusCode();  // throw nếu HTTP ≥ 400 :contentReference[oaicite:3]{index=3}
    }

    public async Task<T> GetFeedAsync<T>(string feedKey)
    {
        // GET /api/v2/{username}/feeds/{feedKey}/data/last
        var endpoint = $"{_username}/feeds/{feedKey}/data/last";
        var response = await _http.GetAsync(endpoint);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<T>()!;
    }
}
