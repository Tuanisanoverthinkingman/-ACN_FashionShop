using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Models;
using Microsoft.AspNetCore.Authorization;

namespace Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        public class CreateUserRequest
        {
            public string Username { get; set; } = null!;
            public string Password { get; set; } = null!;
            public string Email { get; set; } = null!;
            public string FullName { get; set; } = null!;
            public string Phone { get; set; } = null!;
        }

        // 1. Đăng ký người dùng
        [HttpPost("User")]
        public async Task<ActionResult<User>> CreateUser([FromBody] CreateUserRequest request)
        {
            if (await _context.users.AnyAsync(u => u.Username == request.Username))
                return BadRequest(new { message = "Username đã tồn tại." });

            if (await _context.users.AnyAsync(u => u.Phone == request.Phone))
                return BadRequest(new { message = "Số điện thoại đã tồn tại." });

            if (await _context.users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { message = "Email đã tồn tại." });

            var user = new User
            {
                Username = request.Username,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName,
                Email = request.Email,
                Role = "User",
                Phone = request.Phone,
                IsActive = true,
                IsVerified = false,
                EmailVerificationSentAt = DateTime.UtcNow
            };

            _context.users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new { message = "Đăng ký thành công!", userId = user.Id });
        }

        // 2. Tạo Admin
        [HttpPost("Admin")]
        public async Task<ActionResult<User>> CreateAdmin([FromBody] CreateUserRequest request)
        {
            if (await _context.users.AnyAsync(u => u.Username == request.Username))
                return BadRequest(new { message = "Username đã tồn tại." });

            var user = new User
            {
                Username = request.Username,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName,
                Email = request.Email,
                Role = "Admin",
                Phone = request.Phone,
                IsActive = true,
                IsVerified = true,
                EmailVerificationSentAt = DateTime.UtcNow
            };

            _context.users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tạo tài khoản Admin thành công." });
        }

        // 3. Lấy tất cả user
        [HttpGet("getAll")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUser()
        {
            var users = await _context.users
                .Where(u => u.Role != "Admin")
                .OrderByDescending(u => u.Id)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.FullName,
                    u.Phone,
                    u.CreateAt,
                    u.IsActive,
                    u.IsVerified,
                    StatusText = u.IsActive == false ? "Đã khóa"
                               : (u.IsVerified == false && u.EmailVerificationSentAt.HasValue && u.EmailVerificationSentAt.Value.AddHours(24) < DateTime.UtcNow) ? "Chưa xác thực"
                               : (u.IsVerified == false) ? "Chờ xác thực"
                               : "Đang hoạt động"
                })
                .ToListAsync();

            return Ok(users);
        }

        // 4. Thông tin cá nhân
        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<User>> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized();

            var user = await _context.users.FindAsync(userId);
            if (user == null || !user.IsActive) return NotFound(new { message = "Tài khoản không tồn tại hoặc bị khóa." });

            return Ok(user);
        }

        // 5. Vô hiệu hóa / Kích hoạt tài khoản (Thay thế cho Delete cứng)
        [HttpPut("{id}/toggle-active")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleUserActive(int id)
        {
            var user = await _context.users.FindAsync(id);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng." });

            if (user.Role == "Admin")
                return BadRequest(new { message = "Không thể thay đổi trạng thái tài khoản Quản trị viên." });

            user.IsActive = !user.IsActive;

            if (user.IsActive == true)
            {
                user.IsVerified = true;
            }

            await _context.SaveChangesAsync();

            string status = user.IsActive ? "kích hoạt và xác thực" : "vô hiệu hóa";
            return Ok(new { message = $"Đã {status} tài khoản {user.Username}.", isActive = user.IsActive });
        }

        // 6. Xóa vĩnh viễn
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.users.FindAsync(id);
            if (user == null) return NotFound();

            if (user.Role == "Admin")
                return BadRequest(new { message = "Không thể xóa tài khoản Admin." });

            bool hasOrders = await _context.orders.AnyAsync(o => o.UserId == id);
            if (hasOrders)
                return BadRequest(new { message = "User đã có lịch sử đơn hàng, chỉ có thể vô hiệu hóa (Toggle Active)." });

            _context.users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa vĩnh viễn người dùng." });
        }

        // 7. Đổi mật khẩu
        [HttpPut("{id}/change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordRequest request)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (currentUserId != id) return Forbid();

            var user = await _context.users.FindAsync(id);
            if (user == null) return NotFound();

            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.Password))
                return BadRequest(new { message = "Mật khẩu cũ không chính xác." });

            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đổi mật khẩu thành công!" });
        }

        // 8. Cập nhật profile
        [Authorize]
        [HttpPut("update")]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest request)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.users.FindAsync(userId);
            if (user == null) return NotFound();

            if (await _context.users.AnyAsync(u => u.Phone == request.Phone && u.Id != userId))
                return BadRequest(new { message = "Số điện thoại đã được sử dụng bởi tài khoản khác." });

            user.FullName = request.FullName;
            user.Phone = request.Phone;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thông tin thành công!", user });
        }

        [HttpGet("detail/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.users.FindAsync(id);
            return user == null ? NotFound() : Ok(user);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserByAdmin(int id, [FromBody] UpdateUserByAdminRequest request)
        {
            var user = await _context.users.FindAsync(id);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng." });

            if (await _context.users.AnyAsync(u => u.Email == request.Email && u.Id != id))
                return BadRequest(new { message = "Email này đã được sử dụng bởi tài khoản khác." });

            if (await _context.users.AnyAsync(u => u.Phone == request.Phone && u.Id != id))
                return BadRequest(new { message = "Số điện thoại này đã được sử dụng." });

            user.FullName = request.FullName;
            user.Phone = request.Phone;
            user.Email = request.Email;
            
            if (!string.IsNullOrEmpty(request.Role) && (request.Role == "Admin" || request.Role == "User"))
            {
                user.Role = request.Role;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thông tin người dùng thành công!" });
        }
    }

    public class UpdateUserRequest
    {
        public string FullName { get; set; } = null!;
        public string Phone { get; set; } = null!;
    }
    public class ChangePasswordRequest
    {
        public string OldPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }

    public class UpdateUserByAdminRequest
        {
            public string FullName { get; set; } = null!;
            public string Phone { get; set; } = null!;
            public string Email { get; set; } = null!;
            public string Role { get; set; } = null!;
        }
}