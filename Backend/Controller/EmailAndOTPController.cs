using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Net;
using System.Net.Mail;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmailAndOTPController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IMemoryCache _cache;
        private readonly IConfiguration _config;

        public EmailAndOTPController(AppDbContext context, IMemoryCache cache, IConfiguration config)
        {
            _context = context;
            _cache = cache;
            _config = config;
        }

        // Hàm helper dùng chung để gửi Mail
        private async Task SendMailAsync(string toEmail, string subject, string body, bool isHtml = false)
        {
            var emailSettings = _config.GetSection("EmailSettings");
            using var smtp = new SmtpClient(emailSettings["Host"])
            {
                Port = int.Parse(emailSettings["Port"]),
                Credentials = new NetworkCredential(emailSettings["Email"], emailSettings["Password"]),
                EnableSsl = true
            };

            var mail = new MailMessage
            {
                From = new MailAddress(emailSettings["Email"]),
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml
            };
            mail.To.Add(toEmail);

            await smtp.SendMailAsync(mail);
        }

        // 1. Gửi OTP
        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.EmailOrPhone))
                return BadRequest(new { message = "Email không được để trống" });

            var normalizedEmail = request.EmailOrPhone.Trim().ToLower();

            // Check cooldown để tránh spam
            if (_cache.TryGetValue($"OTP_SENT_{normalizedEmail}", out _))
                return BadRequest(new { message = "Vui lòng chờ 60 giây trước khi gửi lại" });

            var userExists = await _context.users.AnyAsync(u => u.Email == normalizedEmail);
            if (!userExists)
                return BadRequest(new { message = "Email chưa được đăng ký" });

            var otp = new Random().Next(100000, 999999).ToString();

            _cache.Set($"OTP_{normalizedEmail}", otp, TimeSpan.FromMinutes(5)); // Tăng lên 5 phút cho user kịp nhập
            _cache.Set($"OTP_SENT_{normalizedEmail}", true, TimeSpan.FromSeconds(60));

            try
            {
                await SendMailAsync(normalizedEmail, "Mã OTP xác thực mật khẩu", $"Mã OTP của bạn là: {otp}. Hiệu lực trong 5 phút.");
                return Ok(new { message = "OTP đã được gửi thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi gửi mail: " + ex.Message });
            }
        }

        // 2. Xác thực OTP → tạo resetToken
        [HttpPost("verify-otp")]
        public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            var normalizedEmail = request.EmailOrPhone.Trim().ToLower();

            if (!_cache.TryGetValue($"OTP_{normalizedEmail}", out string cachedOtp))
                return BadRequest(new { message = "OTP đã hết hạn hoặc chưa được gửi" });

            if (cachedOtp != request.Otp)
                return BadRequest(new { message = "Mã OTP không chính xác" });

            var resetToken = Guid.NewGuid().ToString();
            _cache.Set($"RESET_{normalizedEmail}", resetToken, TimeSpan.FromMinutes(15));
            _cache.Remove($"OTP_{normalizedEmail}");

            return Ok(new { message = "Xác thực thành công", resetToken });
        }

        // 3. Reset password bằng resetToken
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var normalizedEmail = request.Email.Trim().ToLower();

            if (!_cache.TryGetValue($"RESET_{normalizedEmail}", out string cachedToken) || cachedToken != request.ResetToken)
                return BadRequest(new { message = "Phiên làm việc không hợp lệ hoặc đã hết hạn" });

            var user = await _context.users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
            if (user == null) return NotFound();

            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            _cache.Remove($"RESET_{normalizedEmail}");
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đổi mật khẩu thành công" });
        }

        [HttpPost("send-verification-email")]
        public async Task<IActionResult> SendVerificationEmail([FromBody] SendEmailRequest request)
        {
            var user = await _context.users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) return NotFound(new { message = "Người dùng không tồn tại" });

            var token = Guid.NewGuid().ToString();
            var emailVerification = new EmailVerification
            {
                UserId = user.Id,
                Token = token,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                IsUsed = false
            };

            _context.EmailVerifications.Add(emailVerification);

            try
            {
                var verifyLink = $"http://localhost:3000/verify-email?token={token}&email={user.Email}";
                await SendMailAsync(user.Email, "Xác thực tài khoản của bạn",
                    $"Vui lòng nhấn vào link sau để kích hoạt tài khoản: {verifyLink}");

                user.EmailVerificationSentAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Email xác thực đã được gửi" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Gửi email thất bại: " + ex.Message });
            }
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
        {
            var user = await _context.users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return NotFound("Người dùng không tồn tại");

            var record = await _context.EmailVerifications
                .FirstOrDefaultAsync(v =>
                    v.UserId == user.Id &&
                    v.Token == request.Token &&
                    v.IsUsed == false &&
                    v.ExpiresAt > DateTime.UtcNow
                );

            if (record == null)
                return BadRequest("Token không hợp lệ hoặc đã hết hạn");

            // Xác thực thành công → đánh dấu đã dùng
            record.IsUsed = true;

            // Kích hoạt user
            user.IsVerified = true;
            user.IsActive = true;
            await _context.SaveChangesAsync();

            return Ok("Xác thực tài khoản thành công 🎉");
        }
    }
    
    public class SendOtpRequest
    {
        public string EmailOrPhone { get; set; } = string.Empty;
        public bool IsEmail { get; set; } = true;
    }

    public class VerifyOtpRequest
    {
        public string EmailOrPhone { get; set; } = string.Empty;
        public string Otp { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ResetToken { get; set; } = string.Empty;
    }
    public class VerifyEmailRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }

    public class SendEmailRequest
    {
        public string Email { get; set; }
    }
}
