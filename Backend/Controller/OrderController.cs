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

        // 1. Tạo đơn hàng từ giỏ hàng (CÓ TRỪ KHO)
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateOrder([FromBody] List<int> cartItemIds)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var userId = GetUserIdFromClaims();
                if (cartItemIds == null || !cartItemIds.Any())
                    return BadRequest(new { message = "Bạn chưa chọn sản phẩm nào!" });

                var selectedItems = await _context.cartItems
                    .Include(c => c.ProductVariant)
                        .ThenInclude(v => v.Product) // Để lấy tên SP báo lỗi nếu cần
                    .Where(c => c.UserId == userId && cartItemIds.Contains(c.CartItemId))
                    .ToListAsync();

                if (!selectedItems.Any())
                    return BadRequest(new { message = "Không tìm thấy sản phẩm trong giỏ hàng!" });

                // BƯỚC 1: KIỂM TRA TỒN KHO TRƯỚC
                foreach (var item in selectedItems)
                {
                    if (item.ProductVariant == null)
                        return BadRequest(new { message = "Một số phân loại sản phẩm không tồn tại!" });

                    if (item.ProductVariant.Instock < item.Quantity)
                    {
                        return BadRequest(new
                        {
                            message = $"Sản phẩm {item.ProductVariant.Product?.Name} - Size {item.ProductVariant.Size} chỉ còn {item.ProductVariant.Instock} sản phẩm!"
                        });
                    }
                }

                // BƯỚC 2: TÍNH TIỀN & TẠO ĐƠN
                decimal total = selectedItems.Sum(c => c.ProductVariant.Price * c.Quantity);
                var newOrder = new Order
                {
                    UserId = userId,
                    TotalAmount = total,
                    OrderDate = DateTime.Now,
                    OrderStatus = "Pending"
                };

                _context.orders.Add(newOrder);
                await _context.SaveChangesAsync();

                // BƯỚC 3: LƯU CHI TIẾT & TRỪ KHO
                foreach (var item in selectedItems)
                {
                    // Trừ tồn kho
                    item.ProductVariant.Instock -= item.Quantity;

                    _context.orderDetails.Add(new OrderDetail
                    {
                        OrderId = newOrder.OrderId,
                        ProductVariantId = item.ProductVariantId,
                        Quantity = item.Quantity,
                        UnitPrice = item.ProductVariant.Price
                    });
                }

                _context.cartItems.RemoveRange(selectedItems);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync(); // Xác nhận giao dịch hoàn tất

                // Trả về dữ liệu đầy đủ
                var createdOrder = await _context.orders
                    .Include(o => o.OrderDetails).ThenInclude(od => od.ProductVariant).ThenInclude(v => v.Product)
                    .FirstOrDefaultAsync(o => o.OrderId == newOrder.OrderId);

                return Ok(new { message = "Tạo đơn hàng thành công!", order = createdOrder });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi hệ thống: " + ex.Message });
            }
        }

        [HttpGet("getAll")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _context.orders
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.ProductVariant)
                        .ThenInclude(v => v.Product)
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
                    .ThenInclude(d => d.ProductVariant) // ĐỔI CHỖ NÀY
                        .ThenInclude(v => v.Product)
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
                    .ThenInclude(d => d.ProductVariant) // ĐỔI CHỖ NÀY
                        .ThenInclude(v => v.Product)
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

        // Tạo đơn trực tiếp (Mua ngay)
        [HttpPost("order-by-product")]
        [Authorize]
        public async Task<IActionResult> OrderByProduct([FromBody] OrderByProductDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var userId = GetUserIdFromClaims();
                var variant = await _context.product_variants
                    .Include(v => v.Product)
                    .FirstOrDefaultAsync(p => p.Id == dto.ProductVariantId);

                if (variant == null)
                    return NotFound(new { message = "Phân loại sản phẩm không tồn tại!" });

                // KIỂM TRA TỒN KHO
                if (variant.Instock < dto.Quantity)
                {
                    return BadRequest(new { message = $"Sản phẩm này chỉ còn {variant.Instock} sản phẩm!" });
                }

                var total = variant.Price * dto.Quantity;
                var order = new Order
                {
                    UserId = userId,
                    TotalAmount = total,
                    OrderDate = DateTime.Now,
                    OrderStatus = "Pending"
                };

                _context.orders.Add(order);
                await _context.SaveChangesAsync();

                // TRỪ KHO & LƯU CHI TIẾT
                variant.Instock -= dto.Quantity;

                var orderDetail = new OrderDetail
                {
                    OrderId = order.OrderId,
                    ProductVariantId = variant.Id,
                    Quantity = dto.Quantity,
                    UnitPrice = variant.Price
                };

                _context.orderDetails.Add(orderDetail);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var createdOrder = await _context.orders
                    .Include(o => o.OrderDetails).ThenInclude(d => d.ProductVariant).ThenInclude(v => v.Product)
                    .FirstOrDefaultAsync(o => o.OrderId == order.OrderId);

                return Ok(new { message = "Thanh toán thành công!", order = createdOrder });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi hệ thống: " + ex.Message });
            }
        }

        // Lấy các đơn hàng đã có ít nhất 1 payment
        [HttpGet("paid")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPaidOrders()
        {
            var orders = await _context.orders
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.ProductVariant) // ĐỔI CHỖ NÀY
                        .ThenInclude(v => v.Product)
                .Include(o => o.Payments)
                .Where(o => o.Payments.Any())
                .ToListAsync();

            return Ok(new { message = "Lấy các đơn hàng đã mua thành công!", orders });
        }
    }

    public class OrderByProductDto
    {
        public int ProductVariantId { get; set; }
        public int Quantity { get; set; }
    }
}