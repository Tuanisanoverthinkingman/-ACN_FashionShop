using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using System.Security.Claims;
using System.Text;
using System.Security.Cryptography;
using System.Collections;

namespace Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly string vnp_TmnCode = "CL4WNSE0";
        private readonly string vnp_HashSecret = "VJK36E0ZXNMOHDTQEYVR8UWMWY5R4LRD";
        private readonly string vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        private readonly string vnp_ReturnUrl = "https://unpliant-benzylic-giovanny.ngrok-free.dev/checkout/result";

        public PaymentController(AppDbContext context)
        {
            _context = context;
        }

        // 1. CREATE PAYMENT
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

            // Handle promo(tính toán nhưng chưa đánh dấu used)
            Promotion? selectedPromo = null;
            UserPromotion? userPromo = null;

            if (dto.PromoId.HasValue)
            {
                selectedPromo = await _context.promotions
                    .Include(p => p.UserPromotions)
                    .Include(p => p.PromotionProducts)
                    .Include(p => p.PromotionCategories)
                    .FirstOrDefaultAsync(p =>
                        p.PromotionId == dto.PromoId &&
                        p.Status == PromotionStatus.Active &&
                        p.StartDate <= now &&
                        p.EndDate >= now
                    );

                if (selectedPromo == null)
                    return BadRequest(new { message = "Mã khuyến mãi không hợp lệ hoặc đã hết hạn." });

                if (selectedPromo.ApplyType == PromotionApplyType.General ||
                    selectedPromo.ApplyType == PromotionApplyType.User)
                {
                    userPromo = selectedPromo.UserPromotions.FirstOrDefault(up =>
                        up.UserId == userId && !up.IsUsed
                    );

                    if (userPromo == null)
                        return BadRequest(new { message = "Bạn chưa nhận mã này hoặc mã đã được sử dụng." });
                }
            }

            // Tính toán tổng tiền
            var activePromos = await _context.promotions
                .Include(p => p.PromotionProducts)
                .Include(p => p.PromotionCategories)
                .Include(p => p.UserPromotions)
                .Where(p => p.Status == PromotionStatus.Active &&
                            p.StartDate <= now &&
                            p.EndDate >= now)
                .ToListAsync();

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
                decimal bestDiscount = 0;

                foreach (var promo in activePromos)
                {
                    bool applicable = promo.ApplyType switch
                    {
                        PromotionApplyType.Product => promo.PromotionProducts.Any(pp => pp.ProductId == od.ProductId),
                        PromotionApplyType.Category => promo.PromotionCategories.Any(pc => pc.CategoryId == od.Product.CategoryId),
                        _ => false
                    };

                    if (applicable)
                        bestDiscount = Math.Max(bestDiscount, (decimal)promo.DiscountPercent);
                }

                if (selectedPromo != null && (selectedPromo.ApplyType == PromotionApplyType.General || selectedPromo.ApplyType == PromotionApplyType.User))
                {
                    bestDiscount = Math.Max(bestDiscount, (decimal)selectedPromo.DiscountPercent);
                }

                decimal discounted = original * (1 - bestDiscount / 100);
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
                    DiscountApplied = bestDiscount
                });
            }

            // // ĐÁNH DẤU PROMO ĐÃ DÙNG
            // if (userPromo != null)
            // {
            //     userPromo.IsUsed = true;
            //     userPromo.UsedAt = now;
            // }

            // // TRỪ KHO
            // foreach (var od in order.OrderDetails)
            // {
            //     od.Product.Instock -= od.Quantity;
            //     _context.products.Update(od.Product);
            // }

            // TẠO PAYMENT
            var payment = new Payment
            {
                OrderId = order.OrderId,
                PaymentMethod = dto.PaymentMethod,
                Amount = finalAmount,
                Status = PaymentStatus.Pending,
                Address = dto.Address,
                PromoId = selectedPromo?.PromotionId,
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

        // 2. RETRY PAYMENT
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

        // 3. CANCEL PAYMENT
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

        // 4. ADMIN UPDATE STATUS
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

        // 5. GET PAYMENTS (ADMIN)
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

        // 6. GET MY PAYMENTS
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

        // 7. GET PAYMENT BY ID
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

        // 8. GET PAYMENT BY ORDER
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

        // 9. CREATE VNPay LINK
        [HttpPost("create-vnpay/{paymentId}")]
        [Authorize]
        public async Task<IActionResult> CreateVnPay(int paymentId)
        {
            var payment = await _context.payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId);

            if (payment == null) return NotFound();
            if (payment.Status == PaymentStatus.Paid) return BadRequest("Đã thanh toán");

            TimeZoneInfo tz = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            DateTime vnTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);

            string ipAddr = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            if (ipAddr == "::1") ipAddr = "127.0.0.1";

            var vnp_Params = new SortedList<string, string>
            {
                { "vnp_Version", "2.1.0" },
                { "vnp_Command", "pay" },
                { "vnp_TmnCode", vnp_TmnCode },
                { "vnp_Amount", ((long)(payment.Amount * 100)).ToString() },
                { "vnp_CurrCode", "VND" },
                { "vnp_TxnRef", payment.PaymentId.ToString() },
                { "vnp_OrderInfo", $"Thanh toan don hang {payment.OrderId}" },
                { "vnp_OrderType", "fashion" },
                { "vnp_Locale", "vn" },
                { "vnp_ReturnUrl", vnp_ReturnUrl },
                { "vnp_IpAddr", ipAddr },
                { "vnp_CreateDate", vnTime.ToString("yyyyMMddHHmmss") },
                { "vnp_ExpireDate", vnTime.AddMinutes(15).ToString("yyyyMMddHHmmss") }
            };

            var query = string.Join("&", vnp_Params.Select(kvp => $"{kvp.Key}={System.Net.WebUtility.UrlEncode(kvp.Value)}"));

            using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(vnp_HashSecret));
            var hash = BitConverter.ToString(hmac.ComputeHash(Encoding.UTF8.GetBytes(query))).Replace("-", "").ToLower();

            var paymentUrl = $"{vnp_Url}?{query}&vnp_SecureHash={hash}";
            return Ok(new { paymentUrl });
        }

        // 10. VNPay RETURN CALLBACK
        [HttpGet("vnpay-return")]
        public async Task<IActionResult> VnPayReturn()
        {
            var queryParams = Request.Query.ToDictionary(k => k.Key, v => v.Value.ToString());
            if (!queryParams.TryGetValue("vnp_SecureHash", out string? receivedHash))
                return BadRequest("Thiếu chữ ký");

            // Bỏ qua value rỗng và dùng Uri.EscapeDataString để encode lại chuỗi (Fix lỗi Checksum)
            var hashData = queryParams
                .Where(k => k.Key != "vnp_SecureHash" && k.Key != "vnp_SecureHashType")
                .Where(k => !string.IsNullOrEmpty(k.Value)) 
                .OrderBy(k => k.Key)
                .Select(k => $"{k.Key}={Uri.EscapeDataString(k.Value)}") 
                .ToArray();

            var hashString = string.Join("&", hashData);

            using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(vnp_HashSecret));
            var computedHash = BitConverter.ToString(hmac.ComputeHash(Encoding.UTF8.GetBytes(hashString))).Replace("-", "").ToLower();

            if (computedHash != receivedHash)
                return BadRequest("Chữ ký không hợp lệ"); // Nếu vẫn lỗi, bạn có thể in receivedHash và computedHash ra log để so sánh

            if (!queryParams.TryGetValue("vnp_TxnRef", out string? txnRef) || !int.TryParse(txnRef, out int paymentId))
                return BadRequest("PaymentId không hợp lệ");

            var payment = await _context.payments
                .Include(p => p.Order)
                    .ThenInclude(o => o.OrderDetails)
                        .ThenInclude(od => od.Product)
                .Include(p => p.Promotion)
                    .ThenInclude(p => p.UserPromotions)
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId);

            if (payment == null) return NotFound();

            string vnp_ResponseCode = queryParams["vnp_ResponseCode"];
            if (vnp_ResponseCode == "00" && payment.Status != PaymentStatus.Paid)
            {
                payment.Status = PaymentStatus.Paid;
                payment.Order.OrderStatus = "Paid";

                // Trừ kho
                foreach (var od in payment.Order.OrderDetails)
                    od.Product.Instock -= od.Quantity;

                // Đánh dấu promo đã dùng
                if (payment.PromoId.HasValue && payment.Promotion.ApplyType != PromotionApplyType.Product && payment.Promotion.ApplyType != PromotionApplyType.Category)
                {
                    var userPromo = payment.Promotion.UserPromotions.FirstOrDefault(up => !up.IsUsed && up.UserId == payment.Order.UserId);
                    if (userPromo != null)
                    {
                        userPromo.IsUsed = true;
                        userPromo.UsedAt = DateTime.UtcNow;
                    }
                }
            }
            else if (vnp_ResponseCode != "00")
            {
                payment.Status = PaymentStatus.Failed;
                payment.Order.OrderStatus = "PaymentFailed";
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = vnp_ResponseCode == "00" ? "Thanh toán thành công" : "Thanh toán thất bại",
                paymentId = payment.PaymentId,
                status = payment.Status
            });
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
