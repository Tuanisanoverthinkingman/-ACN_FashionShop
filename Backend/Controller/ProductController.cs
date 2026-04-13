using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using OfficeOpenXml;

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

            var product = new Product
            {
                Name = request.Name,
                Description = request.Description,
                CostPrice = request.CostPrice,
                Price = request.Price,
                Instock = request.Instock,
                ImageUrl = request.ImageUrl,
                CategoryId = request.CategoryId,
                CreateAt = DateTime.UtcNow
            };

            _context.products.Add(product);
            await _context.SaveChangesAsync();

            product.Category = category;
            return Ok(product);
        }

        [HttpPost("upload-excel-sheets")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadExcelSheets(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest("File empty");

                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);
                stream.Position = 0;

                using var package = new ExcelPackage(stream);

                var errors = new List<string>();

                foreach (var worksheet in package.Workbook.Worksheets)
                {
                    if (worksheet.Dimension == null)
                        continue;

                    string categoryName = worksheet.Name.Trim();
                    if (string.IsNullOrEmpty(categoryName)) continue;

                    var category = await _context.categories
                        .FirstOrDefaultAsync(c => c.Name == categoryName);

                    if (category == null)
                    {
                        category = new Category { Name = categoryName };
                        _context.categories.Add(category);
                        await _context.SaveChangesAsync();
                    }

                    int rowCount = worksheet.Dimension.Rows;

                    for (int row = 2; row <= rowCount; row++)
                    {
                        try
                        {
                            string name = worksheet.Cells[row, 1].Text?.Trim();
                            if (string.IsNullOrEmpty(name))
                            {
                                errors.Add($"Sheet '{categoryName}', Row {row}: Name rỗng");
                                continue;
                            }

                            string desc = worksheet.Cells[row, 2].Text?.Trim();

                            if (!decimal.TryParse(
                                worksheet.Cells[row, 3].Text.Replace(",", "").Trim(),
                                out var price))
                            {
                                errors.Add($"Sheet '{categoryName}', Row {row}: Price không hợp lệ");
                                continue;
                            }

                            int instock = int.TryParse(
                                worksheet.Cells[row, 4].Text.Trim(),
                                out var s) ? s : 0;

                            string imageUrl = worksheet.Cells[row, 5].Text?.Trim();

                            if (!decimal.TryParse(worksheet.Cells[row, 6].Text.Replace(",", "").Trim(), out var costPrice))
                            {
                                errors.Add($"Sheet '{categoryName}', Row {row}: CostPrice không hợp lệ");
                                continue;
                            }

                            var product = new Product
                            {
                                Name = name,
                                Description = desc,
                                CostPrice = costPrice,
                                Price = price,
                                Instock = instock,
                                ImageUrl = imageUrl,
                                CategoryId = category.Id,
                                CreateAt = DateTime.UtcNow
                            };

                            _context.products.Add(product);
                        }
                        catch (Exception exRow)
                        {
                            Console.WriteLine(exRow.ToString());
                            errors.Add($"Sheet '{categoryName}', Row {row}: {exRow.Message}");
                        }
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = errors.Any()
                        ? "Upload xong nhưng có dòng lỗi"
                        : "Upload thành công",
                    errors
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("===== UPLOAD EXCEL FATAL ERROR =====");
                Console.WriteLine(ex.ToString());
                Console.WriteLine("===================================");

                return StatusCode(500, new
                {
                    message = "Upload Excel thất bại",
                    error = ex.Message
                });
            }
        }


        //Cập nhật sản phẩm (Admin)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateProductRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var product = await _context.products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
                return NotFound(new { message = "Sản phẩm không tồn tại." });

            // Nếu muốn kiểm tra lại CategoryId
            var category = await _context.categories.FindAsync(request.CategoryId);
            if (category == null)
                return BadRequest("CategoryId không hợp lệ!");

            product.Name = request.Name;
            product.Description = request.Description;
            product.Price = request.Price;
            product.Instock = request.Instock;
            product.CategoryId = request.CategoryId;

            if (request.ImageUrl == null)
            {
                // user xoá ảnh
                product.ImageUrl = null;
            }
            else
            {
                // user giữ ảnh hoặc upload ảnh mới
                product.ImageUrl = request.ImageUrl;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật sản phẩm thành công." });
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

        //Lấy danh sách sản phẩm theo từ khoá danh mục (ÁO, QUẦN, PHỤ KIỆN)
        [HttpGet("group/{keyword}")]
        public async Task<IActionResult> GetByCategoryGroup(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest(new { message = "Từ khoá không hợp lệ." });

            string searchTerm = keyword.ToLower().Trim();

            // Xử lý mapping từ URL không dấu (của Frontend) sang Tiếng Việt có dấu (trong Database)
            if (searchTerm == "ao") searchTerm = "áo";
            else if (searchTerm == "quan") searchTerm = "quần";
            else if (searchTerm == "phu-kien" || searchTerm == "phukien") searchTerm = "phụ kiện";

            // Tìm tất cả sản phẩm mà tên Danh mục của nó có chứa từ khoá (Ví dụ: chứa chữ "áo")
            var products = await _context.products
                .Include(p => p.Category)
                .Where(p => p.Category != null && p.Category.Name.ToLower().Contains(searchTerm))
                .OrderByDescending(p => p.Id)
                .ToListAsync();

            // Nếu không có, nên trả về mảng rỗng [] cùng status 200 OK để Frontend dùng hàm .map() không bị lỗi crash app
            return Ok(products);
        }

        // Lấy danh sách sản phẩm ĐANG SALE (có thể lọc thêm theo nhóm danh mục)
        // Dùng cho trang /sale và /sale/{keyword}
        [HttpGet("on-sale/{keyword?}")]
        public async Task<IActionResult> GetSaleProducts(string? keyword = null)
        {
            var now = DateTime.UtcNow;

            // 1. Lấy danh sách ID của Sản phẩm và Danh mục đang được áp dụng khuyến mãi
            var activePromos = await _context.promotions
                .Include(p => p.PromotionProducts)
                .Include(p => p.PromotionCategories)
                .Where(p => p.Status == PromotionStatus.Active &&
                            p.StartDate <= now &&
                            p.EndDate >= now &&
                            p.ApplyType != PromotionApplyType.User) // Bỏ qua promo của cá nhân
                .ToListAsync();

            var onSaleProductIds = activePromos.SelectMany(p => p.PromotionProducts.Select(pp => pp.ProductId)).Distinct().ToList();
            var onSaleCategoryIds = activePromos.SelectMany(p => p.PromotionCategories.Select(pc => pc.CategoryId)).Distinct().ToList();

            // Lấy xem có khuyến mãi General không (nếu General là giảm toàn shop)
            bool hasGeneralPromo = activePromos.Any(p => p.ApplyType == PromotionApplyType.General);

            // 2. Bắt đầu query Sản phẩm
            var query = _context.products.Include(p => p.Category).AsQueryable();

            // Nếu không có General Promo, thì chỉ lấy những sản phẩm nằm trong danh sách giảm giá
            if (!hasGeneralPromo)
            {
                query = query.Where(p => onSaleProductIds.Contains(p.Id) || onSaleCategoryIds.Contains(p.CategoryId));
            }

            // 3. Nếu người dùng chọn menu cụ thể (Ví dụ: /sale/ao-thun, /sale/quan-dai)
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                string searchTerm = keyword.ToLower().Trim();

                // Xử lý các keyword từ Mega Menu của bạn
                if (searchTerm == "quan-ao") searchTerm = "áo|quần"; // Mẹo lấy cả 2
                else if (searchTerm == "ao-thun") searchTerm = "áo thun";
                else if (searchTerm == "ao-so-mi") searchTerm = "áo sơ mi";
                else if (searchTerm == "ao-khoac") searchTerm = "áo khoác";
                else if (searchTerm == "quan-dai") searchTerm = "quần dài"; // Có thể query Kaki, Tây, Jogger
                else if (searchTerm == "quan-short") searchTerm = "quần short";
                else if (searchTerm == "phu-kien") searchTerm = "phụ kiện";

                // Nếu là "quan-ao", ta tìm chữ áo hoặc quần
                if (searchTerm == "áo|quần")
                {
                    query = query.Where(p => p.Category != null &&
                        (p.Category.Name.ToLower().Contains("áo") || p.Category.Name.ToLower().Contains("quần")));
                }
                else
                {
                    query = query.Where(p => p.Category != null && p.Category.Name.ToLower().Contains(searchTerm));
                }
            }

            var products = await query.OrderByDescending(p => p.Id).ToListAsync();

            return Ok(products);
        }

        public class CreateProductRequest
        {
            public string Name { get; set; }
            public string Description { get; set; }
            public decimal CostPrice { get; set; }
            public decimal Price { get; set; }
            public int Instock { get; set; }
            public string? ImageUrl { get; set; }
            public int CategoryId { get; set; }
        }

        public class UpdateProductRequest
        {
            public string Name { get; set; }
            public string Description { get; set; }
            public decimal CostPrice { get; set; }
            public decimal Price { get; set; }
            public int Instock { get; set; }
            public string? ImageUrl { get; set; }
            public int CategoryId { get; set; }
        }
    }
}