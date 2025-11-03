using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Models;
using System.Security.Claims;

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

        // Tạo thanh toán mới (chỉ user đăng nhập)
        [HttpPost("create")]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreatePaymentDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var order = await _context.orders
            .FirstOrDefaultAsync(o => o.OrderId == dto.OrderId && o.UserId == userId);

            if (order == null)
                return BadRequest("Đơn hàng không tồn tại hoặc không thuộc về bạn");

            var newPayment = new Payment
            {
                OrderId = dto.OrderId,
                PaymentMethod = dto.PaymentMethod,
                Amount = order.TotalAmount,
                Status = PaymentStatus.Pending,
                CreateAt = DateTime.UtcNow
            };
            
            _context.payments.Add(newPayment);
            await _context.SaveChangesAsync();
            return Ok(newPayment);
        }

        // Lấy tất cả thanh toán
        [HttpGet("All")]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = User.FindFirstValue(ClaimTypes.Role);

            // var user = await _context.users
            // .FirstOrDefaultAsync(o => o.Id == userId);
            // if (user == null)
            //     return NotFound();

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
                // Lấy các thanh toán có sản phẩm thuộc về Supplier
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

        // Lấy chi tiết thanh toán theo PaymentId
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

            if (payment == null)
                return NotFound("Không tìm thấy thanh toán");

            if (role == "Admin")
                return Ok(payment);

            if (role == "Supplier")
            {
                bool ownsProduct = payment.Order.OrderDetails.Any(od => od.Product.UserId == userId);
                if (!ownsProduct)
                    return Forbid();

                return Ok(payment);
            }

            if (payment.Order.UserId != userId)
                return Forbid();

            return Ok(payment);
        }

        // Lấy thông tin thanh toán theo OrderId
        // User chỉ được xem thanh toán của đơn hàng thuộc về mình
        [HttpGet("order/{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetByOrderId(int orderId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = User.FindFirstValue(ClaimTypes.Role);

            var payment = await _context.payments
                .Include(p => p.Order)
                .ThenInclude(o => o.OrderDetails)
                .ThenInclude(od => od.Product)
                .FirstOrDefaultAsync(p => p.OrderId == orderId);

            if (payment == null)
                return NotFound("Không tìm thấy thanh toán cho đơn hàng này");

            if (role == "Admin")
                return Ok(payment);

            if (role == "Supplier")
            {
                bool ownsProduct = payment.Order.OrderDetails.Any(od => od.Product.UserId == userId);
                if (!ownsProduct)
                    return Forbid();

                return Ok(payment);
            }

            if (payment.Order.UserId != userId)
                return Forbid();

            return Ok(payment);
        }

        // Cập nhật trạng thái thanh toán (chỉ chủ đơn hàng hoặc hệ thống gọi)
        [HttpPut("update-status/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] PaymentStatus newStatus)
        {
            var payment = await _context.payments.FirstOrDefaultAsync(p => p.PaymentId == id);

            if (payment == null)
                return NotFound("Không tìm thấy thanh toán");
            
            payment.Status = newStatus;
            _context.payments.Update(payment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái thành công!", payment });
        }
    }

    public class CreatePaymentDto
    {
        public int OrderId { get; set; }
        public string PaymentMethod { get; set; } = null!;
    }
}
