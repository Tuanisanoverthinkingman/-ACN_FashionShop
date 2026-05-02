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

            // TÌM BIẾN THỂ THAY VÌ SẢN PHẨM CHUNG CHUNG
            var variant = await _context.product_variants.FindAsync(request.ProductVariantId);
            if (variant == null) return NotFound("Không tìm thấy phân loại sản phẩm này");

            // Kiểm tra Instock trong bảng variant
            var existingCart = await _context.cartItems
                .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductVariantId == request.ProductVariantId);

            int totalQuantity = request.Quantity + (existingCart?.Quantity ?? 0);
            if (totalQuantity > variant.Instock)
                return BadRequest($"Số lượng tối đa có thể thêm: {variant.Instock - (existingCart?.Quantity ?? 0)}");

            CartItem cartItem;

            if (existingCart != null)
            {
                existingCart.Quantity += request.Quantity;
                _context.cartItems.Update(existingCart);
                cartItem = existingCart;
            }
            else
            {
                cartItem = new CartItem
                {
                    UserId = (int)userId,
                    ProductVariantId = request.ProductVariantId, // Đổi thành ProductVariantId
                    Quantity = request.Quantity,
                    CreateAt = DateTime.UtcNow
                };
                _context.cartItems.Add(cartItem);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm hàng vào giỏ hàng thành công.",
                cartItemId = cartItem.CartItemId
            });
        }

        // Cập nhật số lượng
        [HttpPut("update-quantity")]
        [Authorize]
        public async Task<IActionResult> UpdateQuantity([FromBody] UpdateCartQuantityRequest request)
        {
            var userId = GetUserIdFromToken();
            if (userId == null) return Unauthorized("Không tìm thấy người dùng.");

            var cartItem = await _context.cartItems
                .Include(c => c.ProductVariant) // Kéo theo dữ liệu variant
                .FirstOrDefaultAsync(c => c.CartItemId == request.CartItemId
                                       && c.UserId == userId);

            if (cartItem == null)
                return NotFound("Không tìm thấy sản phẩm trong giỏ hàng");

            // Kiểm tra Instock từ ProductVariant
            if (request.Quantity > cartItem.ProductVariant.Instock)
                return BadRequest($"Số lượng tối đa có thể đặt: {cartItem.ProductVariant.Instock}");

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
                .IgnoreQueryFilters()
                .Where(c => c.UserId == userId)
                .Include(c => c.ProductVariant)
                    .ThenInclude(v => v.Product)
                .ToListAsync();

            var result = cartItems.Select(c => new
            {
                cartItemId = c.CartItemId,
                productVariantId = c.ProductVariantId,
                quantity = c.Quantity,
                isAvailable = c.ProductVariant != null && c.ProductVariant.Product != null && !c.ProductVariant.Product.IsDeleted,
                variant = c.ProductVariant == null ? null : new
                {
                    size = c.ProductVariant.Size,
                    color = c.ProductVariant.Color,
                    price = c.ProductVariant.Price,
                    inStock = c.ProductVariant.Instock
                },
                product = c.ProductVariant?.Product == null ? null : new
                {
                    id = c.ProductVariant.Product.Id,
                    name = c.ProductVariant.Product.Name,
                    imageUrl = c.ProductVariant.Product.ImageUrl,
                    categoryId = c.ProductVariant.Product.CategoryId
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
        public int ProductVariantId { get; set; }
        public int Quantity { get; set; }
    }
}