using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using Newtonsoft.Json.Linq;
using HtmlAgilityPack;

namespace Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ScraperController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly HttpClient _httpClient;

        // TỐI ƯU 1: Inject HttpClient qua Dependency Injection để tránh cạn kiệt kết nối (Socket Exhaustion)
        public ScraperController(AppDbContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;

            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            _httpClient.DefaultRequestHeaders.Add("Referer", "https://yame.vn");
        }

        [HttpGet("fetch-products")]
        public async Task<IActionResult> FetchProducts()
        {
            // Tham số ?limit=250 để lấy 250 sản phẩm một lần
            string url = "https://yame.vn/products.json?limit=250";

            try
            {
                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode, "Failed to fetch data");

                var content = await response.Content.ReadAsStringAsync();
                var json = JObject.Parse(content);
                var productsArray = json["products"] as JArray;

                if (productsArray == null || !productsArray.Any())
                    return BadRequest("No products found in JSON");

                // BƯỚC 1: XỬ LÝ HÀNG LOẠT DANH MỤC (Tránh N+1)
                // Quét 1 lượt lấy tất cả tên danh mục có trong JSON
                var jsonCategoryNames = productsArray
                    .Select(p => p["product_type"]?.ToString())
                    .Where(name => !string.IsNullOrEmpty(name))
                    .Distinct()
                    .ToList();

                // Lấy các danh mục ĐÃ CÓ trong DB
                var existingCategories = await _context.categories
                    .Where(c => jsonCategoryNames.Contains(c.Name))
                    .ToListAsync();

                var existingCategoryNames = existingCategories.Select(c => c.Name).ToHashSet();

                // Lọc ra các danh mục MỚI TINH chưa có trong DB
                var newCategories = jsonCategoryNames
                    .Where(name => !existingCategoryNames.Contains(name))
                    .Select(name => new Category { Name = name, Description = name })
                    .ToList();

                // Lưu các danh mục mới 1 lần duy nhất
                if (newCategories.Any())
                {
                    _context.categories.AddRange(newCategories);
                    await _context.SaveChangesAsync(); 
                    existingCategories.AddRange(newCategories); // Gộp chung vào list để lát tra cứu ID
                }

                // Biến danh sách thành Dictionary để vòng lặp tra cứu ID với tốc độ cực nhanh (O(1))
                var categoryDict = existingCategories.ToDictionary(c => c.Name, c => c.Id);

                // BƯỚC 2: CHUẨN BỊ DỮ LIỆU ĐỂ LỌC TRÙNG SẢN PHẨM
                // Tải tất cả TÊN sản phẩm đang có trong DB lên RAM (Dùng HashSet để kiểm tra trùng lặp siêu tốc)
                var existingProductNames = await _context.products
                    .Select(p => p.Name)
                    .ToHashSetAsync(); 

                var newProducts = new List<Product>();

                // BƯỚC 3: DỰNG DATA SẢN PHẨM Ở BỘ NHỚ TẠM
                foreach (var item in productsArray)
                {
                    string productName = item["title"]?.ToString() ?? "No Name";

                    // Check trùng lặp ngay trên RAM, KHÔNG chọc vào DB nữa
                    if (existingProductNames.Contains(productName))
                        continue;

                    string categoryName = item["product_type"]?.ToString() ?? "Khác";
                    int categoryId = categoryDict.TryGetValue(categoryName, out int id) ? id : existingCategories.First().Id;

                    var firstVariant = item["variants"]?[0];
                    var firstImage = item["images"]?[0];

                    string html = item["body_html"]?.ToString() ?? "";
                    var doc = new HtmlDocument();
                    doc.LoadHtml(html);
                    string plainDescription = doc.DocumentNode.InnerText;

                    if (plainDescription.Length > 4000)
                        plainDescription = plainDescription.Substring(0, 4000);

                    // TỐI ƯU 2: Dùng Random.Shared hiệu năng cao hơn thay vì khởi tạo new Random() liên tục
                    int stock = Random.Shared.Next(50, 201);

                    var product = new Product
                    {
                        Name = productName,
                        Description = plainDescription,
                        Price = decimal.TryParse(firstVariant?["price"]?.ToString(), out var price) ? price : 0,
                        Instock = stock,
                        ImageUrl = firstImage?["src"]?.ToString(),
                        CategoryId = categoryId
                    };

                    newProducts.Add(product);
                    existingProductNames.Add(productName); // Thêm vào list tạm đề phòng chính trong file JSON có 2 áo trùng tên
                }

                // BƯỚC 4: NHẬP KHO HÀNG LOẠT (Bulk Insert)
                if (newProducts.Any())
                {
                    _context.products.AddRange(newProducts);
                    await _context.SaveChangesAsync(); // Chỉ gọi DB 1 LẦN CUỐI CÙNG
                }

                return Ok(new { message = $"Thành công! Đã cào và lưu thêm {newProducts.Count} sản phẩm mới." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
            }
        }
    }
}