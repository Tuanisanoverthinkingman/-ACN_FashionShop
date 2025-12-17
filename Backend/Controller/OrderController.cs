using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Models;

namespace Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrderController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserIdFromClaims()
        {
            var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                   ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            return int.TryParse(sub, out int id) ? id : 0;
        }

        // Tạo đơn hàng từ giỏ hàng
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateOrder([FromBody] List<int> cartItemIds)
        {
            try
            {
                var userId = GetUserIdFromClaims();

                if (cartItemIds == null || !cartItemIds.Any())
                    return BadRequest(new { message = "Bạn chưa chọn sản phẩm nào!" });

                var selectedItems = await _context.cartItems
                    .Include(c => c.Product)
                    .Where(c => c.UserId == userId && cartItemIds.Contains(c.CartItemId))
                    .ToListAsync();

                if (!selectedItems.Any())
                    return BadRequest(new { message = "Không tìm thấy sản phẩm trong giỏ hàng!" });

                if (selectedItems.Any(c => c.Product == null))
                    return BadRequest(new { message = "Một số sản phẩm không tồn tại!" });

                decimal total = selectedItems.Sum(c => c.Product.Price * c.Quantity);

                var newOrder = new Order
                {
                    UserId = userId,
                    TotalAmount = total,
                    OrderDate = DateTime.Now,
                    OrderStatus = "Pending"
                };

                _context.orders.Add(newOrder);
                await _context.SaveChangesAsync();

                foreach (var item in selectedItems)
                {
                    _context.orderDetails.Add(new OrderDetail
                    {
                        OrderId = newOrder.OrderId,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.Product.Price
                    });
                }

                _context.cartItems.RemoveRange(selectedItems);
                await _context.SaveChangesAsync();

                var createdOrder = await _context.orders
                    .Include(o => o.OrderDetails)
                        .ThenInclude(od => od.Product)
                    .Include(o => o.Payments)
                    .FirstOrDefaultAsync(o => o.OrderId == newOrder.OrderId);
                return Ok(new { message = "Tạo đơn hàng thành công!", order = createdOrder });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server nội bộ: " + ex.Message });
            }
        }

        [HttpGet("getAll")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _context.orders
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.Product)
                .Include(o => o.Payments)
                .ToListAsync();

            return Ok(new { message = "Lấy tất cả đơn hàng thành công!", orders });
        }

        [HttpGet("user")]
        [Authorize]
        public async Task<IActionResult> GetUserOrders()
        {
            var userId = GetUserIdFromClaims();

            var orders = await _context.orders
                .Where(o => o.UserId == userId)
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.Product)
                .Include(o => o.Payments)
                .ToListAsync();

            return Ok(new { message = "Lấy đơn hàng của bạn thành công!", orders });
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var order = await _context.orders
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.Product)
                .Include(p => p.Payments)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
                return NotFound(new { message = "Không tìm thấy đơn hàng!" });

            var userId = GetUserIdFromClaims();
            var user = await _context.users.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return Unauthorized(new { message = "Bạn chưa đăng nhập!" });

            if (user.Role != "Admin" && order.UserId != userId)
                return Forbid("Bạn không có quyền xem đơn hàng này!");

            return Ok(new { message = "Lấy đơn hàng thành công!", order });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.orders.FindAsync(id);
            if (order == null)
                return NotFound(new { message = "Đơn hàng không tồn tại!" });

            var orderDetails = _context.orderDetails.Where(d => d.OrderId == id);
            _context.orderDetails.RemoveRange(orderDetails);
            _context.orders.Remove(order);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Xoá đơn hàng thành công!" });
        }

        // Tạo đơn trực tiếp bằng ProductId
        [HttpPost("order-by-product")]
        [Authorize]
        public async Task<IActionResult> OrderByProduct([FromBody] OrderByProductDto dto)
        {
            try
            {
                var userId = GetUserIdFromClaims();

                if (dto.ProductId <= 0 || dto.Quantity <= 0)
                    return BadRequest(new { message = "Dữ liệu không hợp lệ!" });

                var product = await _context.products
                    .FirstOrDefaultAsync(p => p.Id == dto.ProductId);

                if (product == null)
                    return NotFound(new { message = "Sản phẩm không tồn tại!" });

                var total = product.Price * dto.Quantity;

                var order = new Order
                {
                    UserId = userId,
                    TotalAmount = total,
                    OrderDate = DateTime.Now,
                    OrderStatus = "Pending"
                };

                _context.orders.Add(order);
                await _context.SaveChangesAsync();

                var orderDetail = new OrderDetail
                {
                    OrderId = order.OrderId,
                    ProductId = product.Id,
                    Quantity = dto.Quantity,
                    UnitPrice = product.Price
                };

                _context.orderDetails.Add(orderDetail);
                await _context.SaveChangesAsync();

                var createdOrder = await _context.orders
                    .Include(o => o.OrderDetails)
                        .ThenInclude(d => d.Product)
                    .Include(o => o.Payments)
                    .FirstOrDefaultAsync(o => o.OrderId == order.OrderId);

                return Ok(new
                {
                    message = "Thanh toán sản phẩm thành công!",
                    order = createdOrder
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Lỗi server nội bộ: " + ex.Message
                });
            }
        }
    }
    public class OrderByProductDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}