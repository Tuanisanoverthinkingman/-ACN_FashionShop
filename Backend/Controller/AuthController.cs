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

    //API đăng nhập 
    [HttpPost("login")]
    public async Task<ActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _context.users.FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            return Unauthorized(new { message = "Sai tài khoản hoặc mật khẩu" });

        // Nếu đã gửi email nhưng hết hạn 24h
        if (!user.IsVerified &&
            user.EmailVerificationSentAt.HasValue &&
            user.EmailVerificationSentAt.Value.AddHours(24) < DateTime.UtcNow)
        {
            user.IsActive = false;
            await _context.SaveChangesAsync();

            return BadRequest(new
            {
                message = "Email chưa xác thực và đã hết hạn sau 24h. Vui lòng nhấn 'Gửi lại email xác thực'."
            });
        }

        // Nếu email đã xác thực nhưng tài khoản bị khóa (do admin)
        if (!user.IsActive)
        {
            return BadRequest(new
            {
                message = "Tài khoản của bạn đang bị vô hiệu hóa. Vui lòng liên hệ quản trị viên."
            });
        }

        // Tạo JWT token
        var token = GeneratedJwtToken(user);

        return Ok(new
        {
            Token = token,
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

    //Phương thức tạo token
    private String GeneratedJwtToken(User user)
    {
        var jwtKey = _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT key chưa được cấu hình");
        var SecurityKey = new
            SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(SecurityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role)
        };

        Console.WriteLine("----- Claims: " + String.Join(", ", claims.Select(c => c.Type + ": " + c.Value)));
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],

        audience: _config["Jwt:Audience"],
        claims: claims,
        expires: DateTime.Now.AddMinutes(
            Convert.ToDouble(_config["Jwt:ExpiryInMinutes"])),
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
}


public class LoginRequest
{
    public String Username { get; set; }
    public String Password { get; set; }
}