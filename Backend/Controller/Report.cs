using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    // =========================
    // DASHBOARD TỔNG QUAN
    // =========================
    [HttpGet("summary")]
    public IActionResult GetSummary()
    {
        var totalUsers = _context.users.Count();
        var totalProducts = _context.products.Count();
        var totalOrders = _context.orders.Count();

        // Doanh thu = tổng payment đã PAID
        var totalRevenue = _context.payments
            .Where(p => p.Status == PaymentStatus.Paid)
            .Sum(p => (decimal?)p.Amount) ?? 0;

        return Ok(new
        {
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue
        });
    }

    // =========================
    // ĐƠN HÀNG THEO THÁNG (BIỂU ĐỒ)
    // =========================
    [HttpGet("orders-by-month")]
    public IActionResult OrdersByMonth()
    {
        var data = _context.orders
            .AsEnumerable()
            .GroupBy(o => new
            {
                o.OrderDate.Year,
                o.OrderDate.Month
            })
            .Select(g => new
            {
                month = $"{g.Key.Month:D2}/{g.Key.Year}",
                totalOrders = g.Count(),
                totalAmount = g.Sum(x => x.TotalAmount)
            })
            .OrderBy(x => x.month)
            .ToList();

        return Ok(data);
    }

    // =========================
    // ĐƠN HÀNG HÔM NAY
    // =========================
    [HttpGet("orders-today")]
    public IActionResult OrdersToday()
    {
        var today = DateTime.UtcNow.Date;

        var totalOrders = _context.orders
            .Count(o => o.OrderDate.Date == today);

        return Ok(new
        {
            date = today.ToString("dd/MM/yyyy"),
            totalOrders
        });
    }

    // =========================
    // ĐƠN HÀNG TUẦN NÀY
    // =========================
    [HttpGet("orders-this-week")]
    public IActionResult OrdersThisWeek()
    {
        var today = DateTime.UtcNow.Date;
        var startOfWeek = today.AddDays(-(int)today.DayOfWeek + 1);

        var totalOrders = _context.orders
            .Count(o => o.OrderDate >= startOfWeek);

        return Ok(new
        {
            from = startOfWeek.ToString("dd/MM/yyyy"),
            to = today.ToString("dd/MM/yyyy"),
            totalOrders
        });
    }

    // =========================
    // TOP 5 SẢN PHẨM BÁN CHẠY
    // =========================
    [HttpGet("top-products")]
    public IActionResult TopProducts()
    {
        var data = _context.orderDetails
            .Include(od => od.Product)
            .GroupBy(od => new
            {
                od.ProductId,
                od.Product.Name
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
            .ToList();

        return Ok(data);
    }
}
