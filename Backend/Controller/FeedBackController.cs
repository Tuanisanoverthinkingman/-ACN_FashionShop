using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using System.Security.Claims;

namespace Controllers
{
    [Route("api/[controller]")]
    [ApiController]

    public class FeedbackController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FeedbackController(AppDbContext context)
        {
            _context = context;
        }

        // Lấy UserId và Role từ JWT
        private (int userId, string role) GetUserInfo()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var role = User.FindFirstValue(ClaimTypes.Role);
            return (userId, role);
        }

        // GET: api/Feedback
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var (userId, role) = GetUserInfo();

            IQueryable<Feedback> query = _context.Feedbacks
                .Include(f => f.User)
                .Include(f => f.Product);

            if (role != "Admin")
                query = query.Where(f => f.UserId == userId);

            var feedbacks = await query.ToListAsync();
            return Ok(feedbacks);
        }

        [HttpGet("product/{productId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByProduct(int productId)
        {
            var feedbacks = await _context.Feedbacks
                .Where(f => f.ProductId == productId)
                .Include(f => f.User)
                .Select(f => new
                {
                    f.Id,
                    f.Content,
                    f.Rating,
                    f.ProductId,
                    f.UserId,
                    UserName = f.User.FullName
                })
                .ToListAsync();

            return Ok(feedbacks);
        }

        // POST: api/Feedback
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateFeedbackDto dto)
        {
            var (userId, role) = GetUserInfo();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var feedback = new Feedback
            {
                Content = dto.Content,
                Rating = dto.Rating,
                ProductId = dto.ProductId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            return Ok(feedback);
        }

        // PUT: api/Feedback/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateFeedbackDto dto)
        {
            var (userId, role) = GetUserInfo();

            var existing = await _context.Feedbacks.FindAsync(id);
            if (existing == null)
                return NotFound("Feedback không tìm thấy");

            // User chỉ sửa feedback của mình, Admin được sửa tất cả
            if (role != "Admin" && existing.UserId != userId)
                return Forbid("Bạn không thể sửa feedback");

            existing.Content = dto.Content;
            existing.Rating = dto.Rating;
            existing.ProductId = dto.ProductId;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // DELETE: api/Feedback/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var (userId, role) = GetUserInfo();

            var feedback = await _context.Feedbacks.FindAsync(id);
            if (feedback == null)
                return NotFound("Feedback not found");

            // User chỉ xoá feedback của mình, Admin được xoá tất cả
            if (role != "Admin" && feedback.UserId != userId)
                return Forbid("Bạn không thể xoá feedback");

            _context.Feedbacks.Remove(feedback);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Feedback xoá thành công" });
        }
    }
    public class CreateFeedbackDto
    {
        public string Content { get; set; }

        public int Rating { get; set; }

        public int ProductId { get; set; }
    }
    public class UpdateFeedbackDto
    {
        public string Content { get; set; }
        public int Rating { get; set; }
        public int ProductId { get; set; }
    }
}