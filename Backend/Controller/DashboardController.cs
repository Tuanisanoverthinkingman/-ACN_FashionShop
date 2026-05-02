using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using Microsoft.AspNetCore.Authorization;

namespace Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var totalUsers = await _context.users.CountAsync();
            var totalProducts = await _context.products.CountAsync();
            var totalOrders = await _context.orders.CountAsync();

            var totalRevenue = await _context.payments
                .Where(p => p.Status == PaymentStatus.Paid)
                .SumAsync(p => (decimal?)p.Amount) ?? 0;

            return Ok(new
            {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue
            });
        }

        [HttpGet("orders-by-month")]
        public async Task<IActionResult> OrdersByMonth()
        {
            var orders = await _context.orders
                .Include(o => o.OrderDetails)
                    .ThenInclude(od => od.ProductVariant)
                .Where(o => _context.payments.Any(p => p.OrderId == o.OrderId && p.Status == PaymentStatus.Paid))

                .ToListAsync();

            var data = orders
                .GroupBy(o => new
                {
                    o.OrderDate.Year,
                    o.OrderDate.Month
                })
                .Select(g =>
                {
                    var totalRevenue = g.Sum(x => x.TotalAmount);
                    var totalCost = g.Sum(order =>
                        order.OrderDetails.Sum(od =>
                            od.Quantity * (od.ProductVariant?.CostPrice ?? 0)
                        )
                    );

                    return new
                    {
                        month = $"{g.Key.Month:D2}/{g.Key.Year}",
                        totalOrders = g.Count(),
                        doanhThu = totalRevenue,
                        loiNhuan = totalRevenue - totalCost
                    };
                })
                .OrderBy(x => x.month)
                .ToList();

            return Ok(data);
        }

        [HttpGet("orders-today")]
        public async Task<IActionResult> OrdersToday()
        {
            var today = DateTime.UtcNow.Date;

            var totalOrders = await _context.orders
                .CountAsync(o => o.OrderDate.Date == today);

            return Ok(new
            {
                date = today.ToString("dd/MM/yyyy"),
                totalOrders
            });
        }

        [HttpGet("orders-this-week")]
        public async Task<IActionResult> OrdersThisWeek()
        {
            var today = DateTime.UtcNow.Date;
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek + 1);

            var totalOrders = await _context.orders
                .CountAsync(o => o.OrderDate >= startOfWeek);

            return Ok(new
            {
                from = startOfWeek.ToString("dd/MM/yyyy"),
                to = today.ToString("dd/MM/yyyy"),
                totalOrders
            });
        }

        [HttpGet("top-products")]
        public async Task<IActionResult> TopProducts()
        {
            var data = await _context.orderDetails
                .Include(od => od.ProductVariant)
                    .ThenInclude(pv => pv.Product)
                .Where(od => _context.payments.Any(p => p.OrderId == od.OrderId && p.Status == PaymentStatus.Paid))
                .GroupBy(od => new
                {
                    od.ProductVariant.ProductId,
                    od.ProductVariant.Product.Name
                })
                .Select(g => new
                {
                    productId = g.Key.ProductId,
                    productName = g.Key.Name,
                    quantitySold = g.Sum(x => x.Quantity),
                    revenue = g.Sum(x => x.Quantity * x.UnitPrice)
                })
                .OrderByDescending(x => x.quantitySold)
                .Take(5)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("order-status-stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetOrderStatusStats()
        {
            var stats = await _context.orders
                .GroupBy(o => o.OrderStatus)
                .Select(g => new
                {
                    status = g.Key,
                    count = g.Count()
                })
                .ToListAsync();

            return Ok(stats);
        }

        [HttpGet("revenue-by-category")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RevenueByCategory()
        {
            var data = await _context.orderDetails
                .Include(od => od.ProductVariant)
                    .ThenInclude(v => v.Product)
                        .ThenInclude(p => p.Category)
                .Where(od => _context.payments.Any(p => p.OrderId == od.OrderId && p.Status == PaymentStatus.Paid))
                .GroupBy(od => new
                {
                    CategoryId = od.ProductVariant.Product.CategoryId,
                    CategoryName = od.ProductVariant.Product.Category.Name
                })
                .Select(g => new
                {
                    categoryId = g.Key.CategoryId,
                    categoryName = g.Key.CategoryName,
                    totalSold = g.Sum(x => x.Quantity),
                    revenue = g.Sum(x => x.Quantity * x.UnitPrice)
                })
                .OrderByDescending(x => x.revenue)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("low-stock")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetLowStockProducts([FromQuery] int threshold = 10)
        {
            var lowStock = await _context.product_variants
                .Include(v => v.Product)
                .Where(v => v.Instock <= threshold && v.Product != null && !v.Product.IsDeleted)
                .OrderBy(v => v.Instock)
                .Take(10)
                .Select(v => new
                {
                    productId = v.ProductId,
                    productName = v.Product.Name,
                    size = v.Size,
                    color = v.Color,
                    instock = v.Instock
                })
                .ToListAsync();

            return Ok(lowStock);
        }

        [HttpPost("seed-fake-orders")]
        public async Task<IActionResult> SeedFakeOrders([FromQuery] int count = 50)
        {
            var userIds = await _context.users.Select(u => u.Id).ToListAsync();
            var variants = await _context.product_variants
                .Include(v => v.Product)
                .Where(v => !v.Product.IsDeleted)
                .ToListAsync();

            if (!userIds.Any() || !variants.Any())
                return BadRequest(new { message = "Cần có ít nhất 1 Khách hàng và 1 Sản phẩm để tạo dữ liệu!" });

            var random = new Random();

            var statuses = new[] { "Pending", "Processing", "Shipped", "Delivered", "Delivered", "Delivered", "Cancelled" };
            var paymentMethods = new[] { "COD", "VNPay", "MoMo", "Chuyển khoản ngân hàng" };
            var addresses = new[] {
                "298 Cầu Diễn, Minh Khai, Bắc Từ Liêm, Hà Nội",
                "Ngõ 12, Phố Nhổn, Nam Từ Liêm, Hà Nội",
                "Ký túc xá HaUI, Bắc Từ Liêm, Hà Nội",
                "15 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội"
            };

            var now = DateTime.UtcNow;
            var newOrders = new List<Order>();

            for (int i = 0; i < count; i++)
            {
                int randomDaysAgo = random.Next(0, 180);
                var fakeOrderDate = now.AddDays(-randomDaysAgo);
                var status = statuses[random.Next(statuses.Length)];

                var newOrder = new Order
                {
                    UserId = userIds[random.Next(userIds.Count)],
                    OrderDate = fakeOrderDate,
                    OrderStatus = status,
                    TotalAmount = 0, 
                    OrderDetails = new List<OrderDetail>(),
                    Payments = new List<Payment>()
                };

                decimal orderTotal = 0;
                int numItems = random.Next(1, 4);

                for (int j = 0; j < numItems; j++)
                {
                    var variant = variants[random.Next(variants.Count)];
                    int qty = random.Next(1, 4); 

                    decimal fakePrice = (variant.CostPrice > 0 ? variant.CostPrice : 100000) * 1.5m;

                    newOrder.OrderDetails.Add(new OrderDetail
                    {
                        ProductVariantId = variant.Id,
                        Quantity = qty,
                        UnitPrice = fakePrice
                    });

                    orderTotal += fakePrice * qty;
                }

                newOrder.TotalAmount = orderTotal;

                if (status != "Cancelled")
                {
                    newOrder.Payments.Add(new Payment
                    {
                        Amount = orderTotal,
                        Status = PaymentStatus.Paid,
                        CreateAt = fakeOrderDate.AddHours(2),
                        PaymentMethod = paymentMethods[random.Next(paymentMethods.Length)],
                        Address = addresses[random.Next(addresses.Length)]
                    });
                }

                newOrders.Add(newOrder);
            }

            _context.orders.AddRange(newOrders);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Đã buff thành công {count} đơn hàng ảo vào hệ thống!",
                timeRange = "Dữ liệu được rải đều trong 6 tháng qua."
            });
        }
    }
}