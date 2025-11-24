using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Models;

namespace Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;
        public PaymentController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("create")]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreatePaymentDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Tạo Order mới nếu OrderId = null
            Order order;
            if (dto.OrderId == null)
            {
                if (dto.CartItemIds == null || !dto.CartItemIds.Any())
                    return BadRequest("Chưa có sản phẩm để tạo đơn hàng");

                var cartItems = await _context.cartItems
                    .Include(c => c.Product)
                    .Where(c => c.UserId == userId && dto.CartItemIds.Contains(c.CartItemId))
                    .ToListAsync();

                if (cartItems.Count == 0)
                    return BadRequest("Sản phẩm trong giỏ hàng không tồn tại");

                decimal total = cartItems.Sum(c => c.Quantity * (c.Product?.Price ?? 0));

                order = new Order
                {
                    UserId = userId,
                    TotalAmount = total,
                    OrderDate = DateTime.UtcNow,
                    FullName = dto.ShippingInfo.FullName,
                    Phone = dto.ShippingInfo.Phone,
                    Address = dto.ShippingInfo.Address,
                    Note = dto.ShippingInfo.Note
                };

                _context.orders.Add(order);
                await _context.SaveChangesAsync();

                // Thêm OrderDetails
                foreach (var item in cartItems)
                {
                    _context.orderDetails.Add(new OrderDetail
                    {
                        OrderId = order.OrderId,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.Product?.Price ?? 0
                    });
                }

                _context.cartItems.RemoveRange(cartItems);
                await _context.SaveChangesAsync();
            }
            else
            {
                // Nếu có OrderId, lấy order đã tồn tại
                order = await _context.orders.FirstOrDefaultAsync(o => o.OrderId == dto.OrderId && o.UserId == userId);
                if (order == null) return BadRequest("Đơn hàng không tồn tại hoặc không thuộc về bạn");
            }

            // Tạo Payment COD
            var payment = new Payment
            {
                OrderId = order.OrderId,
                PaymentMethod = "Cash",
                Amount = order.TotalAmount,
                Status = PaymentStatus.Pending,
                CreateAt = DateTime.UtcNow
            };

            _context.payments.Add(payment);
            await _context.SaveChangesAsync();

            return Ok(new { order, payment });
        }

        [HttpGet("All")]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = User.FindFirstValue(ClaimTypes.Role);

            if (role == "Admin")
            {
                var allPayments = await _context.payments
                    .Include(p => p.Order)
                    .ThenInclude(o => o.OrderDetails)
                    .ThenInclude(od => od.Product)
                    .ToListAsync();
                return Ok(allPayments);
            }

            if (role == "Supplier")
            {
                var supplierPayments = await _context.payments
                    .Include(p => p.Order)
                    .ThenInclude(o => o.OrderDetails)
                    .ThenInclude(od => od.Product)
                    .Where(p => p.Order.OrderDetails.Any(od => od.Product.UserId == userId))
                    .ToListAsync();
                return Ok(supplierPayments);
            }

            var userPayments = await _context.payments
                .Include(p => p.Order)
                .Where(p => p.Order.UserId == userId)
                .ToListAsync();

            return Ok(userPayments);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = User.FindFirstValue(ClaimTypes.Role);

            var payment = await _context.payments
                .Include(p => p.Order)
                .ThenInclude(o => o.OrderDetails)
                .ThenInclude(od => od.Product)
                .FirstOrDefaultAsync(p => p.PaymentId == id);

            if (payment == null) return NotFound("Không tìm thấy thanh toán");

            if (role == "Admin") return Ok(payment);
            if (role == "Supplier" && payment.Order.OrderDetails.Any(od => od.Product.UserId == userId)) return Ok(payment);
            if (payment.Order.UserId != userId) return Forbid();

            return Ok(payment);
        }

        [HttpGet("order/{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetByOrderId(int orderId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = User.FindFirstValue(ClaimTypes.Role);

            var payment = await _context.payments
                .Include(p => p.Order)
                .ThenInclude(o => o.OrderDetails)
                .ThenInclude(od => od.Product).FirstOrDefaultAsync(p => p.OrderId == orderId);

            if (payment == null) return NotFound("Không tìm thấy thanh toán cho đơn hàng này");

            if (role == "Admin") return Ok(payment);
            if (role == "Supplier" && payment.Order.OrderDetails.Any(od => od.Product.UserId == userId)) return Ok(payment);
            if (payment.Order.UserId != userId) return Forbid();

            return Ok(payment);
        }

        [HttpPut("update-status/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] PaymentStatus newStatus)
        {
            var payment = await _context.payments.FirstOrDefaultAsync(p => p.PaymentId == id);
            if (payment == null) return NotFound("Không tìm thấy thanh toán");

            payment.Status = newStatus;
            _context.payments.Update(payment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái thành công!", payment });
        }
    }

    public class CreatePaymentDto
    {
        public int? OrderId { get; set; }
        public List<int>? CartItemIds { get; set; }

        public string PaymentMethod { get; set; } = "Cash";

        public ShippingInfoDto ShippingInfo { get; set; } = null!;
    }

    public class ShippingInfoDto
    {
        public string FullName { get; set; } = null!;   // Họ tên người nhận
        public string Phone { get; set; } = null!;      // Số điện thoại
        public string Address { get; set; } = null!;    // Địa chỉ giao hàng
        public string? Note { get; set; }               // Ghi chú (nếu có)
    }
}