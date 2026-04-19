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
                .Where(p => !p.IsDeleted)
                .Include(p => p.Category)
                .Include(p => p.ProductVariants)
                .OrderByDescending(p => p.Id)
                .ToListAsync();
            return Ok(products);
        }

        // Lấy toàn bộ sản phẩm (Dành cho Admin - Thấy cả hàng đã xóa)
        [HttpGet("admin-all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllForAdmin()
        {
            var products = await _context.products
                .Include(p => p.Category)
                .Include(p => p.ProductVariants)
                .IgnoreQueryFilters()
                .OrderByDescending(p => p.Id)
                .ToListAsync();
            return Ok(products);
        }

        // Admin khôi phục sản phẩm
        [HttpPut("restore/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Restore(int id)
        {
            var product = await _context.products
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm để khôi phục" });

            product.IsDeleted = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Sản phẩm đã được khôi phục thành công" });
        }
        //Lấy sản phẩm theo id
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _context.products
                .Include(p => p.Category)
                .Include(p => p.ProductVariants) // THÊM DÒNG NÀY
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
                ImageUrl = request.ImageUrl,
                CategoryId = request.CategoryId,
                CreateAt = DateTime.UtcNow,

                // LOGIC MỚI: Tự động tạo 1 phân loại hàng mặc định từ dữ liệu form cũ
                ProductVariants = new List<ProductVariant>
                {
                    new ProductVariant
                    {
                        Size = "FreeSize",
                        Color = "Mặc định",
                        CostPrice = request.CostPrice,
                        Price = request.Price,
                        Instock = request.Instock
                    }
                }
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
                    if (worksheet.Dimension == null) continue;

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

                            if (!decimal.TryParse(worksheet.Cells[row, 3].Text.Replace(",", "").Trim(), out var price))
                            {
                                errors.Add($"Sheet '{categoryName}', Row {row}: Price không hợp lệ");
                                continue;
                            }

                            int instock = int.TryParse(worksheet.Cells[row, 4].Text.Trim(), out var s) ? s : 0;
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
                                ImageUrl = imageUrl,
                                CategoryId = category.Id,
                                CreateAt = DateTime.UtcNow,

                                // LOGIC MỚI: Đưa Price, CostPrice, Instock vào Biến thể mặc định
                                ProductVariants = new List<ProductVariant>
                                {
                                    new ProductVariant
                                    {
                                        Size = "FreeSize",
                                        Color = "Mặc định",
                                        CostPrice = costPrice,
                                        Price = price,
                                        Instock = instock
                                    }
                                }
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
                    message = errors.Any() ? "Upload xong nhưng có dòng lỗi" : "Upload thành công",
                    errors
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("===== UPLOAD EXCEL FATAL ERROR =====");
                Console.WriteLine(ex.ToString());
                Console.WriteLine("===================================");

                return StatusCode(500, new { message = "Upload Excel thất bại", error = ex.Message });
            }
        }


        //Cập nhật sản phẩm (Admin)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateProductRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // LOGIC MỚI: Kéo thêm bảng ProductVariants lên để update
            var product = await _context.products
                .Include(p => p.ProductVariants)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return NotFound(new { message = "Sản phẩm không tồn tại." });

            var category = await _context.categories.FindAsync(request.CategoryId);
            if (category == null) return BadRequest("CategoryId không hợp lệ!");

            product.Name = request.Name;
            product.Description = request.Description;
            product.CategoryId = request.CategoryId;

            if (request.ImageUrl == null) product.ImageUrl = null;
            else product.ImageUrl = request.ImageUrl;

            // LOGIC MỚI: Cập nhật giá và kho vào biến thể đầu tiên (mặc định)
            var firstVariant = product.ProductVariants.FirstOrDefault();
            if (firstVariant != null)
            {
                firstVariant.Price = request.Price;
                firstVariant.CostPrice = request.CostPrice;
                firstVariant.Instock = request.Instock;
            }
            else
            {
                // Nếu sản phẩm này trước đó chưa có biến thể nào, tạo mới
                product.ProductVariants.Add(new ProductVariant
                {
                    Size = "FreeSize",
                    Color = "Mặc định",
                    CostPrice = request.CostPrice,
                    Price = request.Price,
                    Instock = request.Instock
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật sản phẩm thành công." });
        }

        //Xoá sản phẩm (Admin)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            // Tìm sản phẩm bao gồm cả những cái đã xóa để tránh lỗi logic
            var product = await _context.products
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound(new { message = "Sản phẩm không tồn tại." });
            }

            if (product.IsDeleted)
            {
                return BadRequest(new { message = "Sản phẩm này đã nằm trong danh sách ngưng bán rồi." });
            }

            // Thực hiện xóa mềm
            product.IsDeleted = true;

            _context.products.Update(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Sản phẩm đã được chuyển vào trạng thái ngưng bán (Xóa mềm)." });
        }

        // Lấy sp bằng mã DM
        [HttpGet("by-category/{categoryId}")]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var products = await _context.products
                .Where(p => !p.IsDeleted)
                .Where(p => p.CategoryId == categoryId)
                .Include(p => p.Category)
                .Include(p => p.ProductVariants)
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
            if (searchTerm == "ao") searchTerm = "áo";
            else if (searchTerm == "quan") searchTerm = "quần";
            else if (searchTerm == "phu-kien" || searchTerm == "phukien") searchTerm = "phụ kiện";

            var products = await _context.products
                .Where(p => !p.IsDeleted)
                .Include(p => p.Category)
                .Include(p => p.ProductVariants)
                .Where(p => p.Category != null && p.Category.Name.ToLower().Contains(searchTerm))
                .OrderByDescending(p => p.Id)
                .ToListAsync();

            return Ok(products);
        }

        // Lấy danh sách sản phẩm ĐANG SALE 
        [HttpGet("on-sale/{keyword?}")]
        public async Task<IActionResult> GetSaleProducts(string? keyword = null)
        {
            var now = DateTime.UtcNow;

            var activePromos = await _context.promotions
                .Include(p => p.PromotionProducts)
                .Include(p => p.PromotionCategories)
                .Where(p => p.Status == PromotionStatus.Active &&
                            p.StartDate <= now && p.EndDate >= now &&
                            p.ApplyType != PromotionApplyType.User)
                .ToListAsync();

            var onSaleProductIds = activePromos.SelectMany(p => p.PromotionProducts.Select(pp => pp.ProductId)).Distinct().ToList();
            var onSaleCategoryIds = activePromos.SelectMany(p => p.PromotionCategories.Select(pc => pc.CategoryId)).Distinct().ToList();

            bool hasGeneralPromo = activePromos.Any(p => p.ApplyType == PromotionApplyType.General);

            // THÊM INCLUDE PRODUCTVARIANTS VÀO QUERY
            var query = _context.products
                .Include(p => p.Category)
                .Include(p => p.ProductVariants)
                .AsQueryable();

            if (!hasGeneralPromo)
            {
                query = query.Where(p => onSaleProductIds.Contains(p.Id) || onSaleCategoryIds.Contains(p.CategoryId));
            }

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                string searchTerm = keyword.ToLower().Trim();
                if (searchTerm == "quan-ao") searchTerm = "áo|quần";
                else if (searchTerm == "ao-thun") searchTerm = "áo thun";
                else if (searchTerm == "ao-so-mi") searchTerm = "áo sơ mi";
                else if (searchTerm == "ao-khoac") searchTerm = "áo khoác";
                else if (searchTerm == "quan-dai") searchTerm = "quần dài";
                else if (searchTerm == "quan-short") searchTerm = "quần short";
                else if (searchTerm == "phu-kien") searchTerm = "phụ kiện";

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