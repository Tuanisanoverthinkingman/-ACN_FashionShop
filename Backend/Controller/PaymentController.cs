using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using System.Security.Claims;

namespace Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentController(AppDbContext context)
        {
            _context = context;
        }

        // ==================================================
        // 1. CREATE PAYMENT
        // ==================================================
        [HttpPost("create")]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreatePaymentDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var now = DateTime.UtcNow;

            // ===== LOAD ORDER =====
            var order = await _context.orders
                .Include(o => o.OrderDetails)
                    .ThenInclude(od => od.Product)
                .Include(o => o.Payments)
                .FirstOrDefaultAsync(o => o.OrderId == dto.OrderId && o.UserId == userId);

            if (order == null)
                return BadRequest(new { message = "Đơn hàng không tồn tại hoặc không thuộc về bạn." });

            if (order.Payments.Any(p => p.Status == PaymentStatus.Paid))
                return BadRequest(new { message = "Đơn hàng đã được thanh toán." });

            // ===== LOAD PROMOTION =====
            Promotion? promo = null;
            UserPromotion? userPromo = null;

            if (dto.PromoId.HasValue)
            {
                promo = await _context.promotions
                    .Include(p => p.UserPromotions)
                    .Include(p => p.PromotionProducts)
                    .Include(p => p.PromotionCategories)
                    .FirstOrDefaultAsync(p =>
                        p.PromotionId == dto.PromoId &&
                        p.Status == PromotionStatus.Active &&
                        p.StartDate <= now &&
                        p.EndDate >= now
                    );

                if (promo == null)
                    return BadRequest(new { message = "Mã khuyến mãi không hợp lệ hoặc đã hết hạn." });

                // Chỉ General / User mới cần UserPromotion
                if (promo.ApplyType == PromotionApplyType.General ||
                    promo.ApplyType == PromotionApplyType.User)
                {
                    userPromo = promo.UserPromotions.FirstOrDefault(up =>
                        up.UserId == userId && !up.IsUsed
                    );

                    if (userPromo == null)
                        return BadRequest(new { message = "Bạn chưa nhận mã này hoặc mã đã được sử dụng." });
                }
            }

            // ===== TÍNH TIỀN =====
            decimal totalAmount = 0;
            decimal finalAmount = 0;
            var productBreakdown = new List<object>();

            foreach (var od in order.OrderDetails)
            {
                if (od.Quantity > od.Product.Instock)
                {
                    return BadRequest(new
                    {
                        message = $"Sản phẩm {od.Product.Name} chỉ còn {od.Product.Instock} trong kho."
                    });
                }

                decimal original = od.UnitPrice * od.Quantity;
                bool eligible = false;

                if (promo != null)
                {
                    switch (promo.ApplyType)
                    {
                        case PromotionApplyType.General:
                        case PromotionApplyType.User:
                            eligible = true;
                            break;

                        case PromotionApplyType.Product:
                            eligible = promo.PromotionProducts
                                .Any(pp => pp.ProductId == od.ProductId);
                            break;

                        case PromotionApplyType.Category:
                            eligible = promo.PromotionCategories
                                .Any(pc => pc.CategoryId == od.Product.CategoryId);
                            break;
                    }
                }

                decimal discounted = eligible
                    ? original * (1 - (decimal)promo!.DiscountPercent / 100)
                    : original;

                totalAmount += original;
                finalAmount += discounted;

                productBreakdown.Add(new
                {
                    od.ProductId,
                    od.Product.Name,
                    od.Quantity,
                    od.UnitPrice,
                    OriginalAmount = original,
                    DiscountedAmount = discounted,
                    DiscountApplied = eligible ? promo!.DiscountPercent : 0
                });
            }

            // ===== ĐÁNH DẤU PROMO ĐÃ DÙNG =====
            if (userPromo != null)
            {
                userPromo.IsUsed = true;
                userPromo.UsedAt = now;
            }

            // ===== TRỪ KHO =====
            foreach (var od in order.OrderDetails)
            {
                od.Product.Instock -= od.Quantity;
                _context.products.Update(od.Product);
            }

            // ===== TẠO PAYMENT =====
            var payment = new Payment
            {
                OrderId = order.OrderId,
                PaymentMethod = dto.PaymentMethod,
                Amount = finalAmount,
                Status = PaymentStatus.Pending,
                Address = dto.Address,
                PromoId = promo?.PromotionId,
                CreateAt = now
            };

            _context.payments.Add(payment);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo payment thành công!",
                payment,
                totalAmount,
                finalAmount,
                productBreakdown
            });
        }

        // ==================================================
        // 2. RETRY PAYMENT
        // ==================================================
        [HttpPost("retry/{paymentId}")]
        [Authorize]
        public async Task<IActionResult> RetryPayment(int paymentId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var payment = await _context.payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId);

            if (payment == null)
                return NotFound(new { message = "Payment không tồn tại." });

            if (payment.Order.UserId != userId)
                return Unauthorized();

            if (payment.Status == PaymentStatus.Paid)
                return BadRequest(new { message = "Payment đã thanh toán." });

            payment.Status = PaymentStatus.Pending;
            payment.CreateAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Retry payment thành công!", payment });
        }

        // ==================================================
        // 3. CANCEL PAYMENT
        // ==================================================
        [HttpPost("cancel/{paymentId}")]
        [Authorize]
        public async Task<IActionResult> CancelPayment(int paymentId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var payment = await _context.payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId);

            if (payment == null)
                return NotFound();

            if (payment.Order.UserId != userId)
                return Unauthorized();

            if (payment.Status == PaymentStatus.Paid)
                return BadRequest(new { message = "Không thể hủy payment đã thanh toán." });

            payment.Status = PaymentStatus.Cancelled;
            payment.Order.OrderStatus = "Cancelled";

            await _context.SaveChangesAsync();
            return Ok(new { message = "Hủy payment thành công!", payment });
        }

        // ==================================================
        // 4. ADMIN UPDATE STATUS
        // ==================================================
        [HttpPut("update-status/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string newStatus)
        {
            var payment = await _context.payments.FindAsync(id);
            if (payment == null) return NotFound();

            if (!Enum.TryParse<PaymentStatus>(newStatus, out var status))
                return BadRequest(new { message = "Trạng thái không hợp lệ." });

            payment.Status = status;

            var order = await _context.orders.FindAsync(payment.OrderId);
            if (order != null)
            {
                order.OrderStatus = status switch
                {
                    PaymentStatus.Paid => "Paid",
                    PaymentStatus.Pending => "Pending",
                    PaymentStatus.Failed => "PaymentFailed",
                    PaymentStatus.Cancelled => "Cancelled",
                    _ => order.OrderStatus
                };
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật trạng thái thành công!", payment });
        }

        // ==================================================
        // 5. GET PAYMENTS (ADMIN)
        // ==================================================
        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllPayments()
        {
            var payments = await _context.payments
                .Include(p => p.Order)
                    .ThenInclude(o => o.OrderDetails)
                        .ThenInclude(od => od.Product)
                .Include(p => p.Promotion)
                .OrderByDescending(p => p.CreateAt)
                .ToListAsync();

            return Ok(payments);
        }

        // ==================================================
        // 6. GET MY PAYMENTS
        // ==================================================
        [HttpGet("user")]
        [Authorize]
        public async Task<IActionResult> GetMyPayments()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var payments = await _context.payments
                .Include(p => p.Order)
                    .ThenInclude(o => o.OrderDetails)
                        .ThenInclude(od => od.Product)
                .Include(p => p.Promotion)
                .Where(p => p.Order.UserId == userId)
                .OrderByDescending(p => p.CreateAt)
                .ToListAsync();

            return Ok(payments);
        }

        // ==================================================
        // 7. GET PAYMENT BY ID
        // ==================================================
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetPaymentById(int id)
        {
            var payment = await _context.payments
                .Include(p => p.Order)
                    .ThenInclude(o => o.OrderDetails)
                        .ThenInclude(od => od.Product)
                .Include(p => p.Promotion)
                .FirstOrDefaultAsync(p => p.PaymentId == id);

            if (payment == null) return NotFound();
            return Ok(payment);
        }

        // ==================================================
        // 8. GET PAYMENT BY ORDER
        // ==================================================
        [HttpGet("order/{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetPaymentByOrderId(int orderId)
        {
            var payment = await _context.payments
                .Include(p => p.Order)
                    .ThenInclude(o => o.OrderDetails)
                        .ThenInclude(od => od.Product)
                .Include(p => p.Promotion)
                .Where(p => p.OrderId == orderId)
                .OrderByDescending(p => p.CreateAt)
                .FirstOrDefaultAsync();

            if (payment == null) return NotFound();
            return Ok(payment);
        }
    }

    public class CreatePaymentDto
    {
        public int OrderId { get; set; }
        public int? PromoId { get; set; }
        public string Address { get; set; } = null!;
        public string PaymentMethod { get; set; } = null!;
    }
}
