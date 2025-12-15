using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/promotions")]
    public class PromotionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PromotionController(AppDbContext context)
        {
            _context = context;
        }

        // =========================
        // 1. ADMIN - Tạo promotion
        // =========================
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] PromotionRequest request)
        {
            if (_context.promotions.Any(p => p.Code == request.Code))
            {
                return BadRequest(new { message = "Code promotion đã tồn tại" });
            }

            if (request.StartDate >= request.EndDate)
                return BadRequest(new { message = "StartDate phải nhỏ hơn EndDate" });

            // Validate theo ApplyType
            var validateResult = ValidateApplyType(request);
            if (validateResult != null)
                return validateResult;

            var promo = new Promotion
            {
                Code = request.Code,
                DiscountPercent = request.DiscountPercent,
                Description = request.Description,
                ApplyType = request.ApplyType,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Status = PromotionStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            AttachMappings(promo, request);

            _context.promotions.Add(promo);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tạo promotion thành công" });
        }

        // =========================
        // 2. ADMIN - Lấy tất cả promotion
        // =========================
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllForAdmin()
        {
            var promos = await _context.promotions
                .Include(p => p.PromotionProducts)
                .Include(p => p.PromotionCategories)
                .Include(p => p.UserPromotions)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return Ok(promos);
        }

        // =========================
        // 3. ADMIN - Lấy chi tiết promotion
        // =========================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var promo = await _context.promotions
                .Include(p => p.PromotionProducts)
                .Include(p => p.PromotionCategories)
                .Include(p => p.UserPromotions)
                .FirstOrDefaultAsync(p => p.PromotionId == id);

            if (promo == null)
                return NotFound(new { message = "Promotion không tồn tại" });

            return Ok(promo);
        }

        // =========================
        // 4. ADMIN - Cập nhật promotion
        // =========================
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] PromotionRequest request)
        {
            var promo = await _context.promotions
                .Include(p => p.PromotionProducts)
                .Include(p => p.PromotionCategories)
                .Include(p => p.UserPromotions)
                .FirstOrDefaultAsync(p => p.PromotionId == id);

            if (promo == null)
                return NotFound(new { message = "Promotion không tồn tại" });

            if (request.StartDate >= request.EndDate)
                return BadRequest(new { message = "StartDate phải nhỏ hơn EndDate" });

            var validateResult = ValidateApplyType(request);
            if (validateResult != null)
                return validateResult;

            // Update field
            promo.Code = request.Code;
            promo.DiscountPercent = request.DiscountPercent;
            promo.Description = request.Description;
            promo.ApplyType = request.ApplyType;
            promo.StartDate = request.StartDate;
            promo.EndDate = request.EndDate;

            // Clear toàn bộ mapping cũ
            promo.PromotionProducts.Clear();
            promo.PromotionCategories.Clear();
            if (request.ApplyType != PromotionApplyType.User)
            {
                promo.UserPromotions.Clear();
            }

            AttachMappings(promo, request);

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật promotion thành công" });
        }

        // =========================
        // 5. ADMIN - Xoá promotion
        // =========================
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var promo = await _context.promotions
                .Include(p => p.PromotionProducts)
                .Include(p => p.PromotionCategories)
                .Include(p => p.UserPromotions)
                .FirstOrDefaultAsync(p => p.PromotionId == id);

            if (promo == null)
                return NotFound(new { message = "Promotion không tồn tại" });

            _context.promotions.Remove(promo);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xoá promotion thành công" });
        }

        // =========================
        // 6. ADMIN - Bật / tắt promotion
        // =========================
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var promo = await _context.promotions.FindAsync(id);
            if (promo == null)
                return NotFound(new { message = "Promotion không tồn tại" });
            if (promo.EndDate < DateTime.UtcNow)
            {
                return BadRequest(new { message = "Promotion đã hết hạn, không thể kích hoạt" });
            }

            promo.Status = promo.Status == PromotionStatus.Active
                ? PromotionStatus.Expired
                : PromotionStatus.Active;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật trạng thái thành công",
                status = promo.Status.ToString()
            });
        }

        // =========================
        // 7. PUBLIC - Lấy promotion active (KHÔNG BAO GỒM USER)
        // =========================
        [HttpGet]
        public async Task<IActionResult> GetActivePromotions()
        {
            var now = DateTime.UtcNow;

            var promos = await _context.promotions
                .Include(p => p.PromotionProducts)
                .ThenInclude(pp => pp.Product) // include luôn Product
                .Include(p => p.PromotionCategories)
                .ThenInclude(pc => pc.Category) // include luôn Category
                .Where(p =>
                    p.Status == PromotionStatus.Active &&
                    p.StartDate <= now &&
                    p.EndDate >= now &&
                    p.ApplyType != PromotionApplyType.User
                )
                .ToListAsync();

            var result = promos.Select(p => new
            {
                p.PromotionId,
                p.Code,
                p.DiscountPercent,
                p.Description,
                p.StartDate,
                p.EndDate,
                p.ApplyType,
                ProductIds = p.PromotionProducts.Select(pp => pp.ProductId),
                ProductNames = p.PromotionProducts.Select(pp => pp.Product.Name),
                CategoryIds = p.PromotionCategories.Select(pc => pc.CategoryId),
                CategoryNames = p.PromotionCategories.Select(pc => pc.Category.Name)
            });

            return Ok(result);
        }

        // =========================
        // PUBLIC - Lấy promotion có thể claim (General)
        // =========================
        [HttpGet("claimable")]
        public async Task<IActionResult> GetClaimablePromotions()
        {
            var now = DateTime.UtcNow;

            var promos = await _context.promotions
                .Where(p =>
                    p.Status == PromotionStatus.Active &&
                    p.StartDate <= now &&
                    p.EndDate >= now &&
                    p.ApplyType == PromotionApplyType.General // Chỉ General
                )
                .ToListAsync();

            var result = promos.Select(p => new
            {
                p.PromotionId,
                p.Code,
                p.DiscountPercent,
                p.Description,
                p.StartDate,
                p.EndDate,
                p.ApplyType
            });

            return Ok(result);
        }

        // =========================
        // HELPER METHODS
        // =========================
        private IActionResult? ValidateApplyType(PromotionRequest request)
        {
            return request.ApplyType switch
            {
                PromotionApplyType.Product when request.ProductIds == null || !request.ProductIds.Any()
                    => BadRequest(new { message = "Promotion Product cần ProductIds" }),

                PromotionApplyType.Category when request.CategoryIds == null || !request.CategoryIds.Any()
                    => BadRequest(new { message = "Promotion Category cần CategoryIds" }),

                PromotionApplyType.User when request.UserIds == null || !request.UserIds.Any()
                    => BadRequest(new { message = "Promotion User cần UserIds" }),

                _ => null
            };
        }

        private void AttachMappings(Promotion promo, PromotionRequest request)
        {
            switch (request.ApplyType)
            {
                case PromotionApplyType.Product:
                    promo.PromotionProducts = request.ProductIds!
                        .Select(id => new PromotionProduct { ProductId = id })
                        .ToList();
                    break;

                case PromotionApplyType.Category:
                    promo.PromotionCategories = request.CategoryIds!
                        .Select(id => new PromotionCategory { CategoryId = id })
                        .ToList();
                    break;

                case PromotionApplyType.User:
                    promo.UserPromotions = request.UserIds!
                        .Select(id => new UserPromotion
                        {
                            UserId = id,
                            IsUsed = false
                        })
                        .ToList();
                    break;
            }
        }

        // =========================
        // DEV/TEST - Tạo fake promotions 2 cái mỗi loại (Product, Category, User, General)
        // =========================
        [HttpPost("fake")]
        public async Task<IActionResult> CreateFakePromotions()
        {
            var now = DateTime.UtcNow;

            var fakePromos = new List<Promotion>();

            // --- Product (2 cái) ---
            for (int i = 1; i <= 2; i++)
            {
                fakePromos.Add(new Promotion
                {
                    Code = $"PROD-{i}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
                    DiscountPercent = 10 + i * 5,
                    Description = $"Fake Product promo {i}",
                    ApplyType = PromotionApplyType.Product,
                    StartDate = now,
                    EndDate = now.AddDays(7),
                    Status = PromotionStatus.Active,
                    CreatedAt = now,
                    PromotionProducts = new List<PromotionProduct>
            {
                new PromotionProduct { ProductId = i } // fake productId
            }
                });
            }

            // --- Category (2 cái) ---
            for (int i = 1; i <= 2; i++)
            {
                fakePromos.Add(new Promotion
                {
                    Code = $"CAT-{i}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
                    DiscountPercent = 15 + i * 5,
                    Description = $"Fake Category promo {i}",
                    ApplyType = PromotionApplyType.Category,
                    StartDate = now,
                    EndDate = now.AddDays(7),
                    Status = PromotionStatus.Active,
                    CreatedAt = now,
                    PromotionCategories = new List<PromotionCategory>
            {
                new PromotionCategory { CategoryId = i } // fake categoryId
            }
                });
            }

            // --- User (2 cái) ---
            if (_context.users.Any())
            {
                var existingUserIds = _context.users.Take(2).Select(u => u.Id).ToList();
                for (int i = 0; i < existingUserIds.Count; i++)
                {
                    var userId = existingUserIds[i];
                    fakePromos.Add(new Promotion
                    {
                        Code = $"FAKE-USER-{i + 1}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
                        DiscountPercent = 20 + (i + 1) * 5,
                        Description = $"Fake User promo {i + 1}",
                        ApplyType = PromotionApplyType.User,
                        StartDate = now,
                        EndDate = now.AddDays(7),
                        Status = PromotionStatus.Active,
                        CreatedAt = now,
                        UserPromotions = new List<UserPromotion>
            {
                new UserPromotion { UserId = userId, IsUsed = false }
            }
                    });
                }
            }

            // --- General (2 cái) ---
            for (int i = 1; i <= 2; i++)
            {
                fakePromos.Add(new Promotion
                {
                    Code = $"GEN-{i}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
                    DiscountPercent = 5 + i * 5,
                    Description = $"Fake General promo {i}",
                    ApplyType = PromotionApplyType.General,
                    StartDate = now,
                    EndDate = now.AddDays(7),
                    Status = PromotionStatus.Active,
                    CreatedAt = now
                    // Loại General không cần mapping product/category/user
                });
            }

            _context.promotions.AddRange(fakePromos);
            await _context.SaveChangesAsync();
            var result = fakePromos.Select(p => new
            {
                p.PromotionId,
                p.Code,
                p.ApplyType,
                Products = p.PromotionProducts.Select(pp => new
                {
                    pp.ProductId,
                    ProductName = _context.products.FirstOrDefault(pr => pr.Id == pp.ProductId)?.Name
                }),
                Categories = p.PromotionCategories.Select(pc => new
                {
                    pc.CategoryId,
                    CategoryName = _context.categories.FirstOrDefault(c => c.Id == pc.CategoryId)?.Name
                })
            });

            return Ok(new
            {
                message = "Đã tạo 2 fake promotions mỗi loại (Product, Category, User, General)",
                result
            });
        }
    }
    // =========================
    // REQUEST DTO
    // =========================
    public class PromotionRequest
    {
        public string Code { get; set; } = null!;
        public double DiscountPercent { get; set; }
        public PromotionApplyType ApplyType { get; set; }
        public string? Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public List<int>? ProductIds { get; set; }
        public List<int>? CategoryIds { get; set; }
        public List<int>? UserIds { get; set; }
    }
}
