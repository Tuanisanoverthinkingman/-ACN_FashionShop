using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using Newtonsoft.Json.Linq;
using System.Net.Http;
using HtmlAgilityPack;

namespace Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ScraperController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly HttpClient _httpClient;

        public ScraperController(AppDbContext context)
        {
            _context = context;
            _httpClient = new HttpClient();

            // Thêm header để tránh 403
            _httpClient.DefaultRequestHeaders.Add("User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            _httpClient.DefaultRequestHeaders.Add("Referer", "https://yame.vn");
        }

        [HttpGet("fetch-products")]
        public async Task<IActionResult> FetchProducts()
        {
            string url = "https://yame.vn/products.json";

            try
            {
                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode, "Failed to fetch data");

                var content = await response.Content.ReadAsStringAsync();
                var json = JObject.Parse(content);
                var productsArray = json["products"] as JArray;

                if (productsArray == null)
                    return BadRequest("No products found in JSON");

                foreach (var item in productsArray)
                {
                    // Lấy category từ product_type
                    string categoryName = item["product_type"]?.ToString() ?? "Khác";

                    // Check xem category đã tồn tại chưa
                    var category = await _context.categories
                        .FirstOrDefaultAsync(c => c.Name == categoryName);

                    if (category == null)
                    {
                        category = new Category
                        {
                            Name = categoryName,
                            Description = $"{categoryName}"
                        };
                        _context.categories.Add(category);
                        await _context.SaveChangesAsync();
                    }

                    var firstVariant = item["variants"]?[0];
                    var firstImage = item["images"]?[0];

                    // Strip HTML description
                    string html = item["body_html"]?.ToString() ?? "";
                    var doc = new HtmlDocument();
                    doc.LoadHtml(html);
                    string plainDescription = doc.DocumentNode.InnerText;

                    // Cắt description nếu quá dài để tránh lỗi database
                    if (plainDescription.Length > 4000)
                        plainDescription = plainDescription.Substring(0, 4000);
                    Random rnd = new Random();
                    int stock = rnd.Next(50, 201);
                    var product = new Product
                    {
                        Name = item["title"]?.ToString() ?? "No Name",
                        Description = plainDescription,
                        Price = decimal.TryParse(firstVariant?["price"]?.ToString(), out var price) ? price : 0,
                        Instock = stock,
                        ImageUrl = firstImage?["src"]?.ToString(),
                        CategoryId = category.Id
                    };

                    // Check trùng tên để tránh duplicate
                    if (!_context.products.Any(p => p.Name == product.Name))
                        _context.products.Add(product);
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Categories and Products fetched and saved successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }
    }
}
