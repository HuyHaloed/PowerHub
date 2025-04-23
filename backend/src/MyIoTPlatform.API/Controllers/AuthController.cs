using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.API.Models;
using MyIoTPlatform.API.Services;


namespace MyIoTPlatform.API.Controllers
{
    /// <summary>
    /// Handles user authentication, authorization, and password reset operations.
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly TokenService _tokenService;
        private readonly PasswordResetService _passwordResetService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserService userService, 
            TokenService tokenService,
            PasswordResetService passwordResetService,
            ILogger<AuthController> logger)
        {
            _userService = userService;
            _tokenService = tokenService;
            _passwordResetService = passwordResetService;
            _logger = logger;
        }

        /// <summary>
        /// Logs in to the system and returns a JWT token.
        /// </summary>
        /// <param name="request">The login request containing email and password.</param>
        /// <returns>A JWT token and user information.</returns>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var user = await _userService.AuthenticateAsync(request.Email, request.Password);
                if (user == null)
                    return Unauthorized(new { message = "Invalid email or password" });

                var token = _tokenService.GenerateJwtToken(user);

                var response = new AuthResponse
                {
                    Token = token,
                    User = new UserDto
                    {
                        Id = user.Id,
                        Name = user.Name,
                        Email = user.Email,
                        Avatar = user.Avatar,
                        role = user.role,
                        Subscription = user.Subscription,
                        Preferences = user.Preferences
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Registers a new user.
        /// </summary>
        /// <param name="request">The register request containing user details.</param>
        /// <returns>A success message if registration is successful.</returns>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request, [FromQuery] bool isAdmin = false)
        {
            try
            {
                // Nếu isAdmin = true, tạo tài khoản admin, ngược lại tạo tài khoản user thông thường
                var user = isAdmin 
                    ? await _userService.CreateAdminUserAsync(request)
                    : await _userService.CreateUserAsync(request);

                var token = _tokenService.GenerateJwtToken(user);
                var response = new AuthResponse
                {
                    Token = token,
                    User = new UserDto
                    {
                        Id = user.Id,
                        Name = user.Name,
                        Email = user.Email,
                        Avatar = user.Avatar,
                        role = user.role, 
                        Subscription = user.Subscription,
                        Preferences = user.Preferences
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Logs out of the system.
        /// </summary>
        /// <returns>Status 200 OK.</returns>
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // JWT là stateless nên không cần invalidate token trên server
            // Trong thực tế, có thể lưu blacklist các token đã logout
            return Ok(new { message = "Logged out successfully" });
        }

        /// <summary>
        /// Retrieves the current user's information.
        /// </summary>
        /// <returns>The current user's details, including preferences and subscription.</returns>
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                // Lấy user ID từ token (cần cấu hình JWT authentication)
                var userId = User.FindFirst("sub")?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { message = "Invalid token" });

                var user = await _userService.GetUserByIdAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                var userDto = new UserDto
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    Avatar = user.Avatar,
                    Subscription = user.Subscription,
                    Preferences = user.Preferences
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves a user by their ID.
        /// </summary>
        /// <param name="id">The user's ID.</param>
        /// <returns>The user's details, or 404 if not found.</returns>
        [HttpGet("user/{id}")]
        public async Task<IActionResult> GetUserById(string id)
        {
            try
            {
                var user = await _userService.GetUserByIdAsync(id);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                var userDto = new UserDto
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    Avatar = user.Avatar,
                    Subscription = user.Subscription,
                    Preferences = user.Preferences
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Endpoint yêu cầu đặt lại mật khẩu
        /// </summary>
        /// <param name="request">Thông tin email</param>
        /// <returns>Kết quả yêu cầu đặt lại mật khẩu</returns>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try 
            {
                // Validate email
                if (string.IsNullOrEmpty(request.Email))
                    return BadRequest(new { 
                        success = false, 
                        message = "Email không được để trống" 
                    });

                // Gửi email đặt lại mật khẩu
                var result = await _passwordResetService.RequestPasswordResetAsync(request.Email);

                if (result)
                {
                    _logger.LogInformation($"Password reset requested for email: {request.Email}");
                    return Ok(new { 
                        success = true, 
                        message = "Đã gửi email đặt lại mật khẩu" 
                    });
                }
                else 
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Không tìm thấy tài khoản với email này" 
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in forgot password for email: {request.Email}");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Đã xảy ra lỗi. Vui lòng thử lại sau." 
                });
            }
        }

        /// <summary>
        /// Endpoint xác nhận đặt lại mật khẩu
        /// </summary>
        /// <param name="request">Thông tin đặt lại mật khẩu</param>
        /// <returns>Kết quả đặt lại mật khẩu</returns>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try 
            {
                // Validate input
                if (string.IsNullOrEmpty(request.Token) || 
                    string.IsNullOrEmpty(request.NewPassword))
                    return BadRequest(new { 
                        success = false, 
                        message = "Token và mật khẩu mới không được để trống" 
                    });

                // Validate password strength
                if (request.NewPassword.Length < 8)
                    return BadRequest(new { 
                        success = false, 
                        message = "Mật khẩu phải có ít nhất 8 ký tự" 
                    });

                // Đặt lại mật khẩu
                var result = await _passwordResetService.ResetPasswordAsync(
                    request.Token, 
                    request.NewPassword
                );

                if (result)
                {
                    _logger.LogInformation("Password reset successful");
                    return Ok(new { 
                        success = true, 
                        message = "Đặt lại mật khẩu thành công" 
                    });
                }
                else 
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn" 
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in reset password");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Đã xảy ra lỗi. Vui lòng thử lại sau." 
                });
            }
        }


        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
        {
            try 
            {
                // Xác thực token Google
                var payload = await _passwordResetService.VerifyGoogleToken(request.Token);
                
                // Tạo hoặc lấy user
                var user = await _passwordResetService.GetOrCreateUserFromGoogle(payload.Email, payload.Name);
                
                // Tạo JWT token
                var token = _tokenService.GenerateJwtToken(user);
                
                return Ok(new { token, user });
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = "Google login failed" });
            }
        }

        // Request model
        public class GoogleLoginRequest
        {
            public string Token { get; set; }
        }
    }

    // Request models
    public class ForgotPasswordRequest
    {
        public string Email { get; set; }
    }

    public class ResetPasswordRequest
    {
        public string Token { get; set; }
        public string NewPassword { get; set; }
    }
}