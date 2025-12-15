using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/user-promotions")]
    public class UserPromotionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserPromotionController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách promotion đã claim
        [HttpGet("my")]
        [Authorize]
        public async Task<IActionResult> GetMyPromotions()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var promos = await _context.userPromotions
                .Include(up => up.Promotion)
                    .ThenInclude(p => p.PromotionProducts)
                .Include(up => up.Promotion)
                    .ThenInclude(p => p.PromotionCategories)
                .Where(up => up.UserId == userId)
                .OrderByDescending(up => up.Promotion.CreatedAt)
                .ToListAsync();

            var result = promos.Select(up => new
            {
                up.PromotionId,
                up.Promotion.Code,
                up.Promotion.DiscountPercent,
                up.Promotion.Description,
                up.Promotion.ApplyType,
                up.Promotion.StartDate,
                up.Promotion.EndDate,
                up.Promotion.Status,
                up.IsUsed,
                up.UsedAt,
                ProductIds = up.Promotion.PromotionProducts.Select(x => x.ProductId).ToList(),
                CategoryIds = up.Promotion.PromotionCategories.Select(x => x.CategoryId).ToList()
            });

            return Ok(result);
        }

        // 2. Claim promotion (chỉ General)
        [HttpPost("claim/{promotionId}")]
        [Authorize]
        public async Task<IActionResult> ClaimPromotion(int promotionId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var now = DateTime.UtcNow;

            var promo = await _context.promotions
                .Include(p => p.UserPromotions)
                .FirstOrDefaultAsync(p =>
                    p.PromotionId == promotionId &&
                    p.Status == PromotionStatus.Active &&
                    p.StartDate <= now &&
                    p.EndDate >= now
                );

            if (promo == null)
                return NotFound(new { message = "Promotion không tồn tại hoặc đã hết hạn" });

            if (promo.ApplyType != PromotionApplyType.General)
                return BadRequest(new { message = "Chỉ có promotion General mới có thể claim" });

            if (promo.UserPromotions.Any(up => up.UserId == userId))
            {
                return BadRequest(new { message = "Bạn đã nhận promotion này rồi" });
            }
            try
            {
                _context.userPromotions.Add(new UserPromotion
                {
                    UserId = userId,
                    PromotionId = promotionId,
                    IsUsed = false
                });

                await _context.SaveChangesAsync();

                return Ok(new { message = "Nhận promotion thành công" });
            }
            catch (DbUpdateException)
            {
                return BadRequest(new { message = "Promotion đã được claim trước đó" });
            }
        }

        // 3. Lấy promotion có thể dùng (Checkout)
        [HttpGet("available")]
        [Authorize]
        public async Task<IActionResult> GetAvailablePromotions()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var now = DateTime.UtcNow;

            var promos = await _context.userPromotions
                .Include(up => up.Promotion)
                    .ThenInclude(p => p.PromotionProducts)
                .Include(up => up.Promotion)
                    .ThenInclude(p => p.PromotionCategories)
                .Where(up =>
                    up.UserId == userId &&
                    !up.IsUsed &&
                    up.Promotion.Status == PromotionStatus.Active &&
                    up.Promotion.StartDate <= now &&
                    up.Promotion.EndDate >= now
                )
                .Select(up => new
                {
                    up.PromotionId,
                    up.Promotion.Code,
                    up.Promotion.DiscountPercent,
                    up.Promotion.ApplyType,
                    up.IsUsed,
                    ProductIds = up.Promotion.PromotionProducts.Select(x => x.ProductId).ToList(),
                    CategoryIds = up.Promotion.PromotionCategories.Select(x => x.CategoryId).ToList()
                })
                .ToListAsync();

            return Ok(promos);
        }

        [HttpGet("general")]
        [AllowAnonymous]
        public async Task<IActionResult> GetGeneralPromotions()
        {
            var now = DateTime.UtcNow;

            var promos = await _context.promotions
                .Where(p => p.Status == PromotionStatus.Active &&
                            p.StartDate <= now &&
                            p.EndDate >= now &&
                            p.ApplyType == PromotionApplyType.General)
                .Select(p => new
                {
                    p.PromotionId,
                    p.Code,
                    p.DiscountPercent,
                    p.Description,
                    IsUsed = false
                })
                .ToListAsync();

            return Ok(promos);
        }

        // Lấy tất cả promotion General + đánh dấu đã nhận hay chưa
        [HttpGet("all-for-user")]
        [Authorize]
        public async Task<IActionResult> GetAllPromotionsForUser()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var now = DateTime.UtcNow;

            var promos = await _context.promotions
                .Include(p => p.UserPromotions)
                .Where(p =>
                    p.Status == PromotionStatus.Active &&
                    p.StartDate <= now &&
                    p.EndDate >= now &&
                    p.ApplyType == PromotionApplyType.General
                )
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.PromotionId,
                    p.Code,
                    p.DiscountPercent,
                    p.Description,
                    IsUsed = p.UserPromotions.Any(up => up.UserId == userId)
                })
                .ToListAsync();

            return Ok(promos);
        }

        [HttpGet("applicable")]
        [Authorize]
        public async Task<IActionResult> GetApplicablePromotionsForProduct(int productId, int? categoryId)
        {
            var now = DateTime.UtcNow;

            // Lấy tất cả promo active áp dụng cho Product / Category
            var promos = await _context.promotions
                .Include(p => p.PromotionProducts)
                .Include(p => p.PromotionCategories)
                .Where(p =>
                    p.Status == PromotionStatus.Active &&
                    p.StartDate <= now &&
                    p.EndDate >= now &&
                    (p.ApplyType == PromotionApplyType.Product || p.ApplyType == PromotionApplyType.Category)
                )
                .ToListAsync();

            var applicablePromos = promos
                .Where(p =>
                    (p.ApplyType == PromotionApplyType.Product && p.PromotionProducts.Any(pp => pp.ProductId == productId)) ||
                    (p.ApplyType == PromotionApplyType.Category && categoryId.HasValue && p.PromotionCategories.Any(pc => pc.CategoryId == categoryId.Value))
                )
                .Select(p => new
                {
                    p.PromotionId,
                    p.Code,
                    p.DiscountPercent,
                    p.Description,
                    p.ApplyType,
                    ProductIds = p.PromotionProducts.Select(pp => pp.ProductId).ToList(),
                    CategoryIds = p.PromotionCategories.Select(pc => pc.CategoryId).ToList()
                })
                .ToList();

            return Ok(applicablePromos);
        }

        // 5. INTERNAL – Đánh dấu promotion đã dùng + check loại
        // INTERNAL – áp dụng promo (cả Product / Category / GEN)
        [NonAction]
        public async Task<decimal> ApplyPromotionForOrder(int orderId, List<OrderDetail> orderDetails, int userId)
        {
            var now = DateTime.UtcNow;

            // --- Lấy promo active GEN + Product + Category ---
            var promos = await _context.promotions
                .Include(p => p.PromotionProducts)
                .Include(p => p.PromotionCategories)
                .Include(p => p.UserPromotions)
                .Where(p =>
                    p.Status == PromotionStatus.Active &&
                    p.StartDate <= now &&
                    p.EndDate >= now
                )
                .ToListAsync();

            decimal totalDiscounted = 0;

            foreach (var od in orderDetails)
            {
                decimal itemPrice = od.UnitPrice * od.Quantity;
                decimal bestDiscount = 0;

                foreach (var promo in promos)
                {
                    bool applicable = promo.ApplyType switch
                    {
                        PromotionApplyType.General => promo.UserPromotions.Any(up => up.UserId == userId && !up.IsUsed),
                        PromotionApplyType.Product => promo.PromotionProducts.Any(pp => pp.ProductId == od.ProductId),
                        PromotionApplyType.Category => promo.PromotionCategories.Any(pc => pc.CategoryId == od.Product.CategoryId),
                        _ => false
                    };

                    if (applicable)
                    {
                        bestDiscount = Math.Max(bestDiscount, (decimal)promo.DiscountPercent);
                    }
                }

                totalDiscounted += itemPrice * (1 - bestDiscount / 100);
            }

            return totalDiscounted;
        }
    }
}
