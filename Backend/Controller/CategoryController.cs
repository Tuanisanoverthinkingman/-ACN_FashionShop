using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Controllers
{
    [ApiController]
    [Route("api/categories")]

    public class CategoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoryController(AppDbContext context)
        {
            _context = context;
        }

        //Tạo mới danh mục
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Category>> CreateCategory([FromBody] CategoryRequest request)
        {
            try
            {
                var category = new Category
                {
                    Name = request.Name,
                    Description = request.Description,
                };
                _context.categories.Add(category);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        //Lấy danh mục theo id
        [HttpGet("{id}")]
        public async Task<ActionResult<Category>> GetCategory(int id)
        {
            var category = await _context.categories.FirstOrDefaultAsync(q => q.Id == id);

            if (category == null)
                return NotFound();
            return category;
        }

        //Lấy toàn bộ danh mục
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Category>>> GetAllCategories()
        {
            return await _context.categories.ToListAsync();
        }

        //Cập nhật danh mục
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryRequest request)
        {
            var category = await _context.categories.FirstOrDefaultAsync(q => q.Id == id);
            if (category == null)
                return NotFound();

            var userRole = User.FindFirstValue(ClaimTypes.Role);
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            category.Name = request.Name;
            category.Description = request.Description;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật Category thành công." });
        }

        //Xóa danh mục
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.categories.FirstOrDefaultAsync(q => q.Id == id);

            if (category == null)
                return NotFound(new { message = "Danh mục không tồn tại." });

            // 🔴 KIỂM TRA CATEGORY CÓ PRODUCT KHÔNG
            bool hasProducts = await _context.products
                .AnyAsync(p => p.CategoryId == id);

            if (hasProducts)
            {
                return BadRequest(new
                {
                    message = "Không thể xoá danh mục vì sản phẩm tồn tại trong danh mục."
                });
            }

            _context.categories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(
                new { message = "Xóa Category thành công." }
            );
        }

    }

    public class CategoryRequest
    {
        public string Name { get; set; }
        public string? Description { get; set; }
    }
}