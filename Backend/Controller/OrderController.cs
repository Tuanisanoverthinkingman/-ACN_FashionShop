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

        // Lấy userId từ token
        private int GetUserIdFromClaims()
        {
            var subClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(subClaim, out var userId) ? userId : 0;
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
                    return BadRequest("Bạn chưa chọn sản phẩm nào!");

                var selectedItems = await _context.cartItems
                .Include(c => c.Product)
                .Where(c => c.UserId == userId && cartItemIds.Contains(c.CartItemId))
                .ToListAsync();

                if (selectedItems.Any(c => c.Product == null))
                    return BadRequest("Một số sản phẩm không tồn tại");
                var total = selectedItems.Sum(c => c.Product.Price * c.Quantity);

                var newOrder = new Order
                {
                    UserId = userId,
                    TotalAmount = total,
                    OrderDate = DateTime.Now
                };

                _context.orders.Add(newOrder);
                await _context.SaveChangesAsync();

                foreach (var item in selectedItems)
                {
                    var detail = new OrderDetail
                    {
                        OrderId = newOrder.OrderId,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.Product.Price
                    };

                    _context.orderDetails.Add(detail);
                }

                _context.cartItems.RemoveRange(selectedItems);
                await _context.SaveChangesAsync();

                return Ok(newOrder);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Lỗi!");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.StackTrace);

                return StatusCode(500, "Lỗi server nội bộ : " + ex.Message);
            }
        }

        //Admin: Xem tất cả đơn hàng
        [HttpGet("getAll")]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _context.orders
            .Include(o => o.User)
            .Include(o => o.OrderDetails)
            .ThenInclude(od => od.Product)
            .ToListAsync();
            return Ok(orders);
        }

        //User: Xem đơn hàng của chính mình
        [HttpGet("user")]
        [Authorize]
        public async Task<IActionResult> GetUserOrders()
        {
            var userId = GetUserIdFromClaims();
            var orders = await _context.orders
            .Where(o => o.UserId == userId)
            .Include(o => o.OrderDetails)
            .ThenInclude(od => od.Product)
            .ToListAsync();
            return Ok(orders);
        }

        //Lấy đơn hàng theo ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var order = await _context.orders
            .Include(o => o.OrderDetails)
            .ThenInclude(od => od.Product)
            .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null) return NotFound();

            var userId = GetUserIdFromClaims();
            if (order.UserId != userId)
                return Forbid();
            return Ok(order);
        }

        //Admin: Xoá đơn hàng
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.orders.FindAsync(id);
            if (order == null) return NotFound();

            var orderDetails = _context.orderDetails.Where(d => d.OrderId == id);
            _context.orderDetails.RemoveRange(orderDetails);
            _context.orders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}