// Đặt file này trong thư mục /Controllers/ScraperController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims; // Cần để lấy UserId
using Models; // Namespace chứa Product, Category
using Microsoft.EntityFrameworkCore; // Cần cho FirstOrDefaultAsync

[Authorize(Roles = "Admin, Supplier")] 
[ApiController]
[Route("api/[controller]")]
public class ScraperController : ControllerBase
{
    private readonly YameScraperService _scraperService;
    private readonly AppDbContext _context;
    private readonly Random _random = new Random();

    public ScraperController(YameScraperService scraperService, AppDbContext context)
    {
        _scraperService = scraperService;
        _context = context;
    }

    // Endpoint để kích hoạt cào dữ liệu
    [HttpPost("start-yame-scrape")]
    public async Task<IActionResult> StartYameScrape()
    {
        // === 1. LẤY USER ID TỪ TOKEN (SWAGGER) ===
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int loggedInUserId))
        {
            return Unauthorized("Không thể xác định ID người dùng.");
        }

        // === 2. CÀO DỮ LIỆU THÔ (Giai đoạn 1 + 2) ===
        Console.WriteLine($"Bắt đầu cào bởi User: {loggedInUserId}");
        List<ScrapedProduct> rawProducts = await _scraperService.GetHomepageProductsAsync();

        var detailedProducts = new List<ScrapedProduct>();
        foreach (var product in rawProducts)
        {
            detailedProducts.Add(await _scraperService.GetProductDetailsAsync(product));
            // Thêm độ trễ nhỏ để tránh bị block
            await Task.Delay(TimeSpan.FromMilliseconds(_random.Next(300, 800))); 
        }

        // === 3. CHẾ BIẾN (MAP DTO -> MODEL) ===
        var categoryCache = new Dictionary<string, int>();
        var newDbProducts = new List<Models.Product>();

        foreach (var scrapedProduct in detailedProducts)
        {
            // 3a. Xử lý Category (Tìm hoặc Tạo)
            int categoryId;
            if (!categoryCache.TryGetValue(scrapedProduct.SourceSection, out categoryId))
            {
                var category = await _context.categories
                    .FirstOrDefaultAsync(c => c.Name == scrapedProduct.SourceSection);

                if (category == null)
                {
                    // Tạo mới nếu chưa có
                    category = new Models.Category
                    {
                        Name = scrapedProduct.SourceSection,
                        Description = scrapedProduct.SourceSection,
                        UserId = loggedInUserId // Gán UserId của bạn
                    };
                    _context.categories.Add(category);
                    await _context.SaveChangesAsync(); // Lưu để lấy ID
                }
                categoryId = category.Id;
                categoryCache.Add(category.Name, categoryId);
            }

            // 3b. Tạo Model Product
            var dbProduct = new Models.Product
            {
                Name = scrapedProduct.Name,
                Description = scrapedProduct.Description,
                Price = scrapedProduct.SalePrice,    // Lấy giá bán
                Instock = _random.Next(10, 101), // FAKE Instock theo yêu cầu
                ImageUrl = scrapedProduct.ImageUrl,
                CategoryId = categoryId,
                UserId = loggedInUserId // Gán UserId của bạn
            };
            newDbProducts.Add(dbProduct);
        }

        // === 4. LƯU VÀO DATABASE ===
        await _context.products.AddRangeAsync(newDbProducts);
        int savedCount = await _context.SaveChangesAsync();

        return Ok(new { 
            Message = $"Hoàn tất! Đã cào và lưu {savedCount} sản phẩm.", 
            TotalFound = detailedProducts.Count 
        });
    }
}