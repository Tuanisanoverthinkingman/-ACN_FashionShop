using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

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
    }
}