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

        public class CreateUserRequest
        {
            public string Username { get; set; }
            public string Password { get; set; }
            public string Email { get; set; }
            public string FullName { get; set; }
            public string Phone { get; set; }
        }
        public UserController(AppDbContext context)
        {
            _context = context;
        }

        //Tạo mới người dùng (User)
        [HttpPost("User")]
        public async Task<ActionResult<User>> CreateUser(
            [FromBody] CreateUserRequest request)
        {
            // Kiểm tra xem Username đã tồn tại chưa
            if (await _context.users.AnyAsync(
                u => u.Username == request.Username))
                return BadRequest("Username đã tồn tại.");

            var user = new User
            {
                Username = request.Username,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName,
                Email = request.Email,
                Role = "User",
                Phone = request.Phone,
                IsActive = true
            };

            _context.users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }

        [HttpPost("Admin")]
        public async Task<ActionResult<User>> CreateAdmin(
            [FromBody] CreateUserRequest request)
        {
            // Kiểm tra xem Username đã tồn tại chưa
            if (await _context.users.AnyAsync(
                u => u.Username == request.Username))
                return BadRequest("Username đã tồn tại.");

            var user = new User
            {
                Username = request.Username,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName,
                Email = request.Email,
                Role = "Admin",
                Phone = request.Phone,
                IsActive = true
            };

            _context.users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }

        // Lấy người dùng
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.users.FindAsync(id);
            if (user == null) return NotFound();
            return user;
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<User>> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            if (!int.TryParse(userIdClaim.Value, out int userId)) return Unauthorized();

            var user = await _context.users.FindAsync(userId);
            if (user == null) return NotFound();

            return user;
        }

        // Lấy tất cả user
        [HttpGet("getAll")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<User>>> GetAllUser()
        {
            var users = await _context.users.ToListAsync();
            return Ok(users);
        }

        // Xoá user
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.users.FindAsync(id);
            if (user == null) return NotFound("Không tìm thấy người dùng.");

            _context.users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Đổi mật khẩu
        [HttpPut("{id}/change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordRequest request)
        {
            var user = await _context.users.FindAsync(id);
            if (user == null) return NotFound("Không tìm thấy người dùng.");

            //Kiểm tra mật khẩu cũ
            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.Password))
                return BadRequest("Mật khẩu cũ không đúng.");

            //Đổi mật khẩu mới
            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok("Đổi mật khẩu thành công!");
        }

        public class ChangePasswordRequest
        {
            public string OldPassword { get; set; }
            public string NewPassword { get; set; }
        }
    }
}