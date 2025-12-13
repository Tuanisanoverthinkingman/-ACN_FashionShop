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

        public EmailAndOTPController(AppDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        [HttpPost("send-otp")]
        public IActionResult SendOtp([FromBody] SendOtpRequest request)
        {
            var normalizedEmail = request.EmailOrPhone.Trim().ToLower();
            var otp = new Random().Next(100000, 999999).ToString();

            _cache.Set($"OTP_{normalizedEmail}", otp, TimeSpan.FromMinutes(1));

            try
            {
                using var smtp = new SmtpClient("smtp.gmail.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential("sniper021003@gmail.com", "iwoj flbu lsjf kpnw"),
                    EnableSsl = true
                };

                var mail = new MailMessage
                {
                    From = new MailAddress("sniper021003@gmail.com"),
                    Subject = "OTP xác thực",
                    Body = $"Mã OTP của bạn là: {otp}",
                    IsBodyHtml = false
                };
                mail.To.Add(normalizedEmail);
                smtp.Send(mail);
            }
            catch (Exception ex)
            {
                return Ok(new { message = "Gửi email thất bại: " + ex.Message });
            }

            return Ok(new { message = "OTP đã được gửi, kiểm tra email" });
        }

        [HttpPost("verify-otp")]
        public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            var normalizedEmail = request.EmailOrPhone.Trim().ToLower();

            if (!_cache.TryGetValue($"OTP_{normalizedEmail}", out string cachedOtp))
                return Ok(new { message = "OTP hết hạn hoặc chưa được gửi" });

            if (cachedOtp != request.Otp)
                return Ok(new { message = "OTP không đúng" });

            _cache.Remove($"OTP_{normalizedEmail}");
            return Ok(new { message = "Xác thực OTP thành công" });
        }

        [HttpPost("send-verification-email")]
        public async Task<IActionResult> SendVerificationEmail([FromBody] SendEmailRequest request)
        {
            var user = await _context.users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return NotFound("Người dùng không tồn tại");

            var token = Guid.NewGuid().ToString();

            // Lưu token vào database
            var emailVerification = new EmailVerification
            {
                UserId = user.Id,
                Token = token,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                IsUsed = false
            };

            _context.EmailVerifications.Add(emailVerification);
            await _context.SaveChangesAsync();

            try
            {
                using var smtp = new SmtpClient("smtp.gmail.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential("sniper021003@gmail.com", "iwoj flbu lsjf kpnw"),
                    EnableSsl = true
                };

                var verifyLink = $"http://localhost:3000/verify-email?token={token}&email={user.Email}";
                var mail = new MailMessage
                {
                    From = new MailAddress("sniper021003@gmail.com"),
                    Subject = "Xác thực tài khoản",
                    Body = $"Nhấn để xác thực tài khoản: {verifyLink}",
                    IsBodyHtml = false
                };

                mail.To.Add(user.Email);
                smtp.Send(mail);
            }
            catch (Exception ex)
            {
                return BadRequest("Gửi email thất bại: " + ex.Message);
            }

            user.EmailVerificationSentAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok("Email xác thực đã được gửi.");
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
    // Request Models
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