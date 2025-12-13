using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Models;
using System.Security.Claims;

namespace Controllers
{
    [Route("api/CartItems")]
    [ApiController]
    public class CartItemsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CartItemsController(AppDbContext context)
        {
            _context = context;
        }

        private int? GetUserIdFromToken()
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
            return userIdClaim != null ? int.Parse(userIdClaim.Value) : (int?)null;
        }

        // Thêm sản phẩm vào giỏ hàng
        [HttpPost("add")]
        [Authorize]
        public async Task<IActionResult> AddToCart([FromBody] CartRequest request)
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized("Không tìm thấy người dùng");

            var product = await _context.products.FindAsync(request.ProductId);
            if (product == null) return NotFound("Không tìm thấy sản phẩm");

            // Kiểm tra Instock
            var existingCart = await _context.cartItems
                .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == request.ProductId);

            int totalQuantity = request.Quantity + (existingCart?.Quantity ?? 0);
            if (totalQuantity > product.Instock)
                return BadRequest($"Số lượng tối đa có thể thêm: {product.Instock - (existingCart?.Quantity ?? 0)}");

            if (existingCart != null)
            {
                existingCart.Quantity += request.Quantity;
                _context.cartItems.Update(existingCart);
            }
            else
            {
                _context.cartItems.Add(new CartItem
                {
                    UserId = (int)userId,
                    ProductId = request.ProductId,
                    Quantity = request.Quantity,
                    CreateAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Thêm hàng vào giỏ hàng thành công." });
        }

        // Cập nhật số lượng
        [HttpPut("update-quantity")]
        [Authorize]
        public async Task<IActionResult> UpdateQuantity([FromBody] UpdateCartQuantityRequest request)
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized("Không tìm thấy người dùng.");

            var cartItem = await _context.cartItems
                .Include(c => c.Product)
                .FirstOrDefaultAsync(c => c.CartItemId == request.CartItemId
                                       && c.UserId == userId);

            if (cartItem == null)
                return NotFound("Không tìm thấy sản phẩm trong giỏ hàng");

            if (request.Quantity > cartItem.Product.Instock)
                return BadRequest($"Số lượng tối đa có thể đặt: {cartItem.Product.Instock}");

            if (request.Quantity < 1)
            {
                _context.cartItems.Remove(cartItem);
            }
            else
            {
                cartItem.Quantity = request.Quantity;
                _context.cartItems.Update(cartItem);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật giỏ hàng thành công." });
        }

        // Lấy giỏ hàng của user
        [HttpGet("get")]
        [Authorize]
        public async Task<IActionResult> GetCart()
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized("Không tìm thấy người dùng.");

            var cartItems = await _context.cartItems
                .Where(c => c.UserId == userId)
                .Include(c => c.Product)
                .ToListAsync();

            // Trả về dữ liệu gọn cho frontend
            var result = cartItems.Select(c => new
            {
                cartItemId = c.CartItemId,
                productId = c.ProductId,
                quantity = c.Quantity,
                product = new
                {
                    id = c.Product.Id,
                    name = c.Product.Name,
                    imageUrl = c.Product.ImageUrl,
                    price = c.Product.Price
                }
            });

            return Ok(result);
        }

        // Xoá sản phẩm khỏi giỏ hàng
        [HttpDelete("delete/{cartItemId}")]
        [Authorize]
        public async Task<IActionResult> DeleteFromCart(int cartItemId)
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized("Không tìm thấy người dùng.");

            var cartItem = await _context.cartItems
                .FirstOrDefaultAsync(c => c.CartItemId == cartItemId && c.UserId == userId);

            if (cartItem == null) return NotFound("Không tìm thấy sản phẩm trong giỏ hàng.");

            _context.cartItems.Remove(cartItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xoá sản phẩm khỏi giỏ hàng" });
        }
    }
    public class UpdateCartQuantityRequest
    {
        public int CartItemId { get; set; }
        public int Quantity { get; set; }
    }

    public class CartRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}
