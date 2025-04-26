namespace MyIoTPlatform.Application.Interfaces.Communication
{
    public interface IAdafruitApiClient
{
    /// <summary>
    /// Gửi dữ liệu (value) lên feedKey tương ứng.
    /// POST https://io.adafruit.com/api/v2/{username}/feeds/{feedKey}/data
    /// </summary>
    Task PublishAsync(string feedKey, object data);

    /// <summary>
    /// Lấy mục dữ liệu cuối cùng của feedKey.
    /// GET https://io.adafruit.com/api/v2/{username}/feeds/{feedKey}/data/last
    /// </summary>
    Task<T> GetFeedAsync<T>(string feedKey);
}

}