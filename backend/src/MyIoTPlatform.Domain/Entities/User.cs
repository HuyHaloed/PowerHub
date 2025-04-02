namespace MyIoTPlatform.Domain.Entities;

public class User
{
    public string UserName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty; // Lưu ý: Nên sử dụng các phương pháp bảo mật để lưu trữ mật khẩu
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime CreatedTime { get; set; }
    public DateTime? UpdatedTime { get; set; }
}