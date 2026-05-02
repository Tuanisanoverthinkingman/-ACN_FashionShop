using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Models;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Identity.Data;


[ApiController]
[Route("api/auth")]
public class AuthController : Controller
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext context, IConfiguration config)
    {
        _config = config;
        _context = context;
    }

    // API đăng nhập 
    [HttpPost("login")]
    public async Task<ActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _context.users.FirstOrDefaultAsync(u => u.Username == request.Username);

        // 1. Kiểm tra tài khoản / mật khẩu
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
        {
            return Unauthorized(new { message = "Sai tài khoản hoặc mật khẩu" });
        }

        // 2. Kiểm tra nếu Admin đã khóa tài khoản
        if (!user.IsActive)
        {
            return BadRequest(new { message = "Tài khoản của bạn đang bị vô hiệu hóa. Vui lòng liên hệ quản trị viên." });
        }

        // 3. Kiểm tra xác thực Email
        if (!user.IsVerified)
        {
            if (user.EmailVerificationSentAt.HasValue && user.EmailVerificationSentAt.Value.AddHours(24) < DateTime.UtcNow)
            {
                user.IsActive = false;
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Email chưa xác thực và đã hết thời gian 24h. Vui lòng chọn 'Gửi lại email xác thực'." });
            }

            return BadRequest(new { message = "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để kích hoạt tài khoản." });
        }

        // 4. Tạo JWT token
        var token = GeneratedJwtToken(user);

        // 5. Gắn Token vào HttpOnly Cookie
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_config["Jwt:ExpiryInMinutes"]))
        };

        Response.Cookies.Append("token", token, cookieOptions);

        // 6. Trả về thông tin User (Không trả token ở body nữa)
        return Ok(new
        {
            message = "Đăng nhập thành công",
            User = new
            {
                user.Id,
                user.Username,
                user.FullName,
                user.Role,
                user.Email,
                user.Phone,
                user.CreateAt,
                user.IsActive
            }
        });
    }

    // Tạo token
    private string GeneratedJwtToken(User user)
    {
        var jwtKey = _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT key chưa được cấu hình");
        var SecurityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(SecurityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(_config["Jwt:ExpiryInMinutes"])),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [HttpGet("debug-claims")]
    [Authorize]
    public IActionResult DebugClaims()
    {
        var claims = User.Claims.Select(c => new
        {
            Type = c.Type,
            Value = c.Value
        }).ToList();

        return Ok(claims);
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("token", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None
        });

        return Ok(new { message = "Đăng xuất thành công" });
    }
}

public class LoginRequest
{
    public String Username { get; set; }
    public String Password { get; set; }
}