// using Microsoft.AspNetCore.Authentication.JwtBearer;
// using Microsoft.IdentityModel.Tokens;
// using System.Text;

// public class Startup
// {
//     public IConfiguration Configuration { get; }

//     public Startup(IConfiguration configuration)
//     {
//         Configuration = configuration;
//     }

//     public void ConfigureServices(IServiceCollection services)
//     {
//         // Thêm cấu hình JWT Authentication
//         services.AddAuthentication(options =>
//         {
//             // Thiết lập scheme mặc định cho Authentication
//             options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
//             options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
//         })
//         .AddJwtBearer(options => 
//         {
//             options.TokenValidationParameters = new TokenValidationParameters
//             {
//                 // Validate issuer của token
//                 ValidateIssuer = true,
//                 ValidIssuer = Configuration["Jwt:Issuer"],

//                 // Validate audience của token
//                 ValidateAudience = true,
//                 ValidAudience = Configuration["Jwt:Audience"],

//                 // Validate thời gian sống của token
//                 ValidateLifetime = true,
                
//                 // Validate key ký của token
//                 ValidateIssuerSigningKey = true,
//                 IssuerSigningKey = new SymmetricSecurityKey(
//                     Encoding.UTF8.GetBytes(Configuration["Jwt:Key"])),

//                 // Cấu hình thêm các tham số validation
//                 ClockSkew = TimeSpan.FromMinutes(5) // Cho phép token còn hiệu lực thêm 5 phút sau thời gian hết hạn
//             };

//             // Cấu hình các sự kiện JWT Bearer
//             options.Events = new JwtBearerEvents
//             {
//                 OnAuthenticationFailed = context =>
//                 {
//                     // Log lỗi xác thực
//                     Console.WriteLine($"Authentication failed: {context.Exception.Message}");
//                     return Task.CompletedTask;
//                 },
//                 OnTokenValidated = context =>
//                 {
//                     // Thực hiện các xác thực bổ sung nếu cần
//                     return Task.CompletedTask;
//                 }
//             };
//         });
//     }

//     public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
//     {
//         // Đảm bảo middleware Authentication được đặt trước Authorization
//         app.UseAuthentication();
//         app.UseAuthorization();
//     }
// }
