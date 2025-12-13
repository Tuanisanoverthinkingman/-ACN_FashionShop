using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using System.Security.Claims;

namespace Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bắt buộc login
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

        // GET: api/Feedback/product/5
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetByProduct(int productId)
        {
            var (userId, role) = GetUserInfo();

            IQueryable<Feedback> query = _context.Feedbacks
                .Where(f => f.ProductId == productId)
                .Include(f => f.User);

            if (role != "Admin")
                query = query.Where(f => f.UserId == userId);

            var feedbacks = await query.ToListAsync();
            return Ok(feedbacks);
        }

        // POST: api/Feedback
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Feedback feedback)
        {
            var (userId, role) = GetUserInfo();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // User chỉ được tạo feedback cho chính mình
            feedback.UserId = userId;
            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();
            return Ok(feedback);
        }

        // PUT: api/Feedback/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Feedback feedback)
        {
            var (userId, role) = GetUserInfo();

            var existing = await _context.Feedbacks.FindAsync(id);
            if (existing == null)
                return NotFound("Feedback not found");

            // User chỉ sửa feedback của mình, Admin được sửa tất cả
            if (role != "Admin" && existing.UserId != userId)
                return Forbid("You cannot edit this feedback");

            existing.Content = feedback.Content;
            existing.Rating = feedback.Rating;
            existing.ProductId = feedback.ProductId;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // DELETE: api/Feedback/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var (userId, role) = GetUserInfo();

            var feedback = await _context.Feedbacks.FindAsync(id);
            if (feedback == null)
                return NotFound("Feedback not found");

            // User chỉ xoá feedback của mình, Admin được xoá tất cả
            if (role != "Admin" && feedback.UserId != userId)
                return Forbid("You cannot delete this feedback");

            _context.Feedbacks.Remove(feedback);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Feedback deleted successfully" });
        }
    }
}
