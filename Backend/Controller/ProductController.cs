using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Controllers
{
    [Route("api/products")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ProductsController(AppDbContext context)
        {
            _context = context;
        }

        //Lấy toàn bộ sản phẩm
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var products = await _context.products
                .Include(p => p.Category)
                .OrderByDescending(p => p.Id)
                .ToListAsync();
            return Ok(products);
        }

        //Lấy sản phẩm theo id
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _context.products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
                return NotFound();
            return Ok(product);
        }

        //Thêm sản phẩm (Admin)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateProductRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var category = await _context.categories.FindAsync(request.CategoryId);
            if (category == null)
                return BadRequest("CategoryId không hợp lệ!");

            // Lấy userId từ token JWT
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var product = new Product
            {
                Name = request.Name,
                Description = request.Description,
                Price = request.Price,
                Instock = request.Instock,
                ImageUrl = request.ImageUrl,
                CategoryId = request.CategoryId,
                UserId = userId,
                CreateAt = DateTime.UtcNow
            };

            _context.products.Add(product);
            await _context.SaveChangesAsync();

            product.Category = category;
            return Ok(product);
        }

        //Cập nhật sản phẩm (Admin)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] Product request)
        {
            var product = await _context.products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
                return NotFound();

            var userRole = User.FindFirstValue(ClaimTypes.Role);
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            // Nếu muốn kiểm tra lại CategoryId
            var category = await _context.categories.FindAsync(request.CategoryId);
            if (category == null)
                return BadRequest("CategoryId không hợp lệ!");

            product.Name = request.Name;
            product.Description = request.Description;
            product.Price = request.Price;
            product.Instock = request.Instock;
            product.ImageUrl = request.ImageUrl;
            product.CategoryId = request.CategoryId;

            await _context.SaveChangesAsync();
            product.Category = category;
            return Ok(product);
        }

        //Xoá sản phẩm (Admin)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _context.products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
                return NotFound();

            var userRole = User.FindFirstValue(ClaimTypes.Role);
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            _context.products.Remove(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa sản phẩm thành công." });
        }

        // Lấy sp bằng mã DM
        [HttpGet("by-category/{categoryId}")]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var products = await _context.products
                .Where(p => p.CategoryId == categoryId)
                .Include(p => p.Category)
                .OrderByDescending(p => p.Id)
                .ToListAsync();

            if (products == null || !products.Any())
                return NotFound(new { message = "Không tìm thấy sản phẩm nào trong nhóm này." });

            return Ok(products);
        }

        public class CreateProductRequest
        {
            public string Name { get; set; }
            public string Description { get; set; }
            public decimal Price { get; set; }
            public int Instock { get; set; }
            public string ImageUrl { get; set; }
            public int CategoryId { get; set; }
        }
    }
}