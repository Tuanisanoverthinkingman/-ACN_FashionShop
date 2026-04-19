using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Models;

namespace Controllers
{
    [Route("api/orderdetails")]
    [ApiController]
    public class OrderDetailsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrderDetailsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("order/{orderId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByOrderId(int orderId)
        {
            var order = await _context.orders
                .Include(o => o.OrderDetails!)
                    .ThenInclude(od => od.ProductVariant) // SỬA CHỖ NÀY: Gọi ProductVariant trước
                        .ThenInclude(pv => pv.Product)    // RỒI MỚI GỌI Product để lấy Tên và Hình ảnh
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) return NotFound("Không tìm thấy đơn hàng.");

            return Ok(order.OrderDetails);
        }

        // Chỉ người dùng đã mua mới xem được chi tiết đơn hàng
        [HttpGet("user/{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetByUser(int orderId)
        {
            // Dùng cách lấy Sub/NameIdentifier đồng nhất với OrderController
            var userIdClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Không tìm thấy thông tin người dùng.");

            var order = await _context.orders
                .IgnoreQueryFilters() // Quan trọng: Khách hàng vẫn phải thấy sản phẩm cũ trong đơn hàng dù Admin đã xóa/ẩn sản phẩm đó
                .Include(o => o.OrderDetails!)
                    .ThenInclude(od => od.ProductVariant)
                        .ThenInclude(pv => pv.Product)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) return NotFound("Không tìm thấy đơn hàng.");

            // Kiểm tra quyền sở hữu đơn hàng
            if (order.UserId != userId) return Forbid();

            return Ok(order.OrderDetails);
        }
    }
}