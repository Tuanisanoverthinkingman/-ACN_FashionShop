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

        // Helper lấy UserId và Role
        private (int userId, string role) GetUserInfo()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userId = string.IsNullOrEmpty(userIdStr) ? 0 : int.Parse(userIdStr);
            var role = User.FindFirstValue(ClaimTypes.Role) ?? "";
            return (userId, role);
        }

        // GET: api/Feedback (Dành cho trang Quản lý của User hoặc Admin)
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var (userId, role) = GetUserInfo();

            IQueryable<Feedback> query = _context.Feedbacks
                .IgnoreQueryFilters() 
                .Include(f => f.User)
                .Include(f => f.Product);

            // Nếu là User thường thì chỉ lấy feedback của họ (bao gồm cả bị ẩn)
            if (role != "Admin")
            {
                query = query.Where(f => f.UserId == userId);
            }

            var feedbacks = await query.OrderByDescending(f => f.CreatedAt).ToListAsync();
            return Ok(feedbacks);
        }

        [HttpGet("product/{productId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByProduct(int productId)
        {
            var feedbacks = await _context.Feedbacks
                .Include(f => f.Product)
                .Where(f => f.ProductId == productId && !f.Product.IsDeleted && f.Status == 0)
                .Include(f => f.User)
                .Select(f => new
                {
                    f.Id,
                    f.Content,
                    f.Rating,
                    f.ProductId,
                    f.UserId,
                    UserName = f.User.FullName,
                    f.CreatedAt,
                    f.AdminReply,
                    f.ReplyAt
                })
                .OrderByDescending(f => f.Id)
                .ToListAsync();

            return Ok(feedbacks);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateFeedbackDto dto)
        {
            var (userId, _) = GetUserInfo();

            var product = await _context.products.FindAsync(dto.ProductId);
            if (product == null || product.IsDeleted)
                return BadRequest(new { message = "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh." });

            var feedback = new Feedback
            {
                Content = dto.Content,
                Rating = dto.Rating,
                ProductId = dto.ProductId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                Status = 0
            };

            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Gửi đánh giá thành công!", feedback });
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateFeedbackDto dto)
        {
            var (userId, role) = GetUserInfo();

            var existing = await _context.Feedbacks.FindAsync(id);
            if (existing == null)
                return NotFound("Không tìm thấy đánh giá này.");

            if (role == "Admin")
            {
                if (dto.Status.HasValue) 
                    existing.Status = dto.Status.Value;

                if (dto.AdminReply != null)
                {
                    existing.AdminReply = dto.AdminReply;
                    existing.ReplyAt = DateTime.UtcNow;
                }
            }
            else
            {
                if (existing.UserId != userId)
                    return Forbid();

                if (!string.IsNullOrEmpty(dto.Content))
                    existing.Content = dto.Content;
                    
                if (dto.Rating.HasValue)
                    existing.Rating = dto.Rating.Value;

                existing.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công", feedback = existing });
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var (userId, role) = GetUserInfo();

            var feedback = await _context.Feedbacks.FindAsync(id);
            if (feedback == null)
                return NotFound("Đánh giá không tồn tại.");

            if (role != "Admin" && feedback.UserId != userId)
                return Forbid();

            _context.Feedbacks.Remove(feedback);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa đánh giá vĩnh viễn khỏi CSDL." });
        }
    }

    public class CreateFeedbackDto
    {
        public string Content { get; set; } = string.Empty;
        public int Rating { get; set; }
        public int ProductId { get; set; }
    }

    public class UpdateFeedbackDto
    {
        public string? Content { get; set; }
        public int? Rating { get; set; }
        public int? Status { get; set; }
        public string? AdminReply { get; set; }
    }
}