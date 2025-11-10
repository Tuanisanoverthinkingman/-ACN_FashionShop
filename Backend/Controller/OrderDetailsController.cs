using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Models;
using System.IdentityModel.Tokens.Jwt;

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

        // Lấy userId từ token
        private int GetUserIdFromClaims()
        {
            var subClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(subClaim, out var userId) ? userId : 0;
        }

        //GET: api/orderdetails/order/{orderId}
        [HttpGet("order/{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetByOrderId(int orderId)
        {
            var order = await _context.orders
            .Include(o => o.OrderDetails!)
            .ThenInclude(od => od.Product)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);
            int currentUserId = GetUserIdFromClaims();
            if (order.UserId != currentUserId) return Forbid();
            if (order == null) return NotFound("Không tìm thấy đơn hàng.");
            return Ok(order.OrderDetails);
        }

        // Chỉ người dùng đã mua mới xem được chi tiết đơn hàng
        [HttpGet("user/{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetByUser(int orderId)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized("Không tìm thấy thông tin người dùng.");

            var userId = int.Parse(userIdClaim.Value);
            Console.WriteLine($"Đã gọi API lấy chi tiết đơn hàng {orderId} bởi user {userId}");
            var order = await _context.orders
            .Include(o => o.OrderDetails!)
            .ThenInclude(od => od.Product)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) return NotFound("Không tìm thấy đơn hàng.");

            if (order.UserId != userId) return Forbid("Bạn không có quyền truy cập đơn hàng này.");

            return Ok(order.OrderDetails);
        }
    }
}