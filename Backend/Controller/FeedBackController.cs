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

            if (role != "Admin")
            {
                query = query.Where(f => f.UserId == userId);
            }

            var feedbacks = await query.OrderByDescending(f => f.CreatedAt).ToListAsync();
            return Ok(feedbacks);
        }

        // GET: api/Feedback/product/{productId} (Dành cho trang chi tiết sản phẩm - Client)
        [HttpGet("product/{productId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByProduct(int productId)
        {
            var feedbacks = await _context.Feedbacks
                .Include(f => f.Product)
                .Where(f => f.ProductId == productId && !f.Product.IsDeleted)
                .Include(f => f.User)
                .Select(f => new
                {
                    f.Id,
                    f.Content,
                    f.Rating,
                    f.ProductId,
                    f.UserId,
                    UserName = f.User.FullName,
                    f.CreatedAt
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
                CreatedAt = DateTime.UtcNow
            };

            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Gửi đánh giá thành công!", feedback });
        }

        // PUT: api/Feedback/{id} (Cập nhật đánh giá)
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateFeedbackDto dto)
        {
            var (userId, role) = GetUserInfo();

            var existing = await _context.Feedbacks.FindAsync(id);
            if (existing == null)
                return NotFound("Không tìm thấy đánh giá này.");

            // Chỉ chủ nhân hoặc Admin mới được sửa
            if (role != "Admin" && existing.UserId != userId)
                return Forbid();

            existing.Content = dto.Content;
            existing.Rating = dto.Rating;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công", feedback = existing });
        }

        // DELETE: api/Feedback/{id} (Xóa đánh giá)
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
            return Ok(new { message = "Đã xóa đánh giá." });
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
        public string Content { get; set; } = string.Empty;
        public int Rating { get; set; }
    }
}