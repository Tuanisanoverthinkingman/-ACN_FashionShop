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
                    .ThenInclude(od => od.ProductVariant) 
                        .ThenInclude(pv => pv.Product)    
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) return NotFound("Không tìm thấy đơn hàng.");

            return Ok(order.OrderDetails);
        }

        [HttpGet("user/{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetByUser(int orderId)
        {
            var userIdClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                           ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Không tìm thấy thông tin người dùng.");

            var order = await _context.orders
                .IgnoreQueryFilters()
                .Include(o => o.OrderDetails!)
                    .ThenInclude(od => od.ProductVariant)
                        .ThenInclude(pv => pv.Product)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) return NotFound("Không tìm thấy đơn hàng.");

            if (order.UserId != userId) return Forbid();

            return Ok(order.OrderDetails);
        }
    }
}