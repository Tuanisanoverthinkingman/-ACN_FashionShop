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
            try
            {
                // Kéo danh sách category và product hiện có lên RAM (CHỈ 1 LẦN TRƯỚC VÒNG LẶP)
                var existingCategories = await _context.categories.ToListAsync();
                var categoryDict = existingCategories.ToDictionary(c => c.Name, c => c.Id);
                var existingCategoryNames = existingCategories.Select(c => c.Name).ToHashSet();

                var existingProductNames = await _context.products.Select(p => p.Name).ToHashSetAsync();
                var newProducts = new List<Product>();

                int page = 1;
                int totalFetched = 0;
                bool hasMoreData = true;

                // Vòng lặp cào từng trang
                while (hasMoreData && totalFetched < 1400) // Giới hạn lấy 1400 sản phẩm
                {
                    // Thêm tham số page vào URL
                    string url = $"https://yame.vn/products.json?limit=250&page={page}";

                    var response = await _httpClient.GetAsync(url);
                    if (!response.IsSuccessStatusCode)
                    {
                        // Nếu lỗi ở trang đầu thì báo lỗi, nếu ở trang sau thì thoát vòng lặp
                        if (page == 1) return StatusCode((int)response.StatusCode, "Failed to fetch data");
                        break;
                    }

                    var content = await response.Content.ReadAsStringAsync();
                    var json = JObject.Parse(content);
                    var productsArray = json["products"] as JArray;

                    // Nếu mảng rỗng -> Đã cào đến trang cuối cùng -> Thoát vòng lặp
                    if (productsArray == null || !productsArray.Any())
                    {
                        hasMoreData = false;
                        break;
                    }

                    // XỬ LÝ DANH MỤC MỚI TRONG TRANG NÀY
                    var jsonCategoryNames = productsArray
                        .Select(p => p["product_type"]?.ToString())
                        .Where(name => !string.IsNullOrEmpty(name))
                        .Distinct()
                        .ToList();

                    var newCategoriesThisPage = jsonCategoryNames
                        .Where(name => !existingCategoryNames.Contains(name))
                        .Select(name => new Category { Name = name, Description = name })
                        .ToList();

                    if (newCategoriesThisPage.Any())
                    {
                        _context.categories.AddRange(newCategoriesThisPage);
                        await _context.SaveChangesAsync();

                        foreach (var cat in newCategoriesThisPage)
                        {
                            categoryDict[cat.Name] = cat.Id;
                            existingCategoryNames.Add(cat.Name);
                        }
                    }

                    // DỰNG DATA SẢN PHẨM Ở BỘ NHỚ TẠM
                    foreach (var item in productsArray)
                    {
                        string productName = item["title"]?.ToString() ?? "No Name";

                        if (existingProductNames.Contains(productName))
                            continue;

                        string categoryName = item["product_type"]?.ToString() ?? "Khác";
                        int categoryId = categoryDict.TryGetValue(categoryName, out int id) ? id : existingCategories.FirstOrDefault()?.Id ?? 0;

                        var imagesArray = item["images"] as JArray;
                        string? imageUrl = (imagesArray != null && imagesArray.Count > 0)
                                           ? imagesArray[0]["src"]?.ToString()
                                           : null;

                        // Xử lý mô tả
                        string html = item["body_html"]?.ToString() ?? "";
                        var doc = new HtmlDocument();
                        doc.LoadHtml(html);
                        string plainDescription = doc.DocumentNode.InnerText;
                        if (plainDescription.Length > 4000) plainDescription = plainDescription.Substring(0, 4000);

                        // 1. Tạo đối tượng Product (Thông tin chung)
                        var product = new Product
                        {
                            Name = productName,
                            Description = plainDescription,
                            ImageUrl = imageUrl,
                            CategoryId = categoryId,
                            ProductVariants = new List<ProductVariant>() // Khởi tạo list để chứa các size/màu
                        };

                        // 2. Lặp qua TẤT CẢ các biến thể của sản phẩm này
                        var optionsArray = item["options"] as JArray;
                        string sizeOptionKey = "option2"; // Giá trị dự phòng mặc định
                        string colorOptionKey = "option1"; // Giá trị dự phòng mặc định

                        if (optionsArray != null)
                        {
                            for (int i = 0; i < optionsArray.Count; i++)
                            {
                                string optionName = optionsArray[i]["name"]?.ToString().ToLower() ?? "";

                                // Nếu tên option chứa chữ "kích thước", "size" thì nó nằm ở option(i+1)
                                if (optionName.Contains("kích") || optionName.Contains("size"))
                                {
                                    sizeOptionKey = $"option{i + 1}";
                                }
                                // Nếu tên option chứa chữ "màu", "color"
                                else if (optionName.Contains("màu") || optionName.Contains("color"))
                                {
                                    colorOptionKey = $"option{i + 1}";
                                }
                            }
                        }

                        // 2. Lặp qua TẤT CẢ các biến thể của sản phẩm này
                        var variantsArray = item["variants"] as JArray;
                        if (variantsArray != null)
                        {
                            foreach (var variant in variantsArray)
                            {
                                decimal price = decimal.TryParse(variant["price"]?.ToString(), out var p) ? p : 0;
                                decimal costPrice = price * 0.7m; // Giá nhập = 70% giá bán

                                // LOGIC MỚI: Lấy giá trị dựa trên Key đã phân tích được ở trên
                                string size = variant[sizeOptionKey]?.ToString() ?? "FreeSize";
                                string color = variant[colorOptionKey]?.ToString() ?? "Mặc định";

                                // Dọn dẹp dữ liệu (Tránh trường hợp bị rỗng)
                                if (string.IsNullOrWhiteSpace(size)) size = "FreeSize";
                                if (string.IsNullOrWhiteSpace(color)) color = "Mặc định";

                                int stock = int.TryParse(variant["inventory_quantity"]?.ToString(), out var qty) ? qty : Random.Shared.Next(10, 50);

                                product.ProductVariants.Add(new ProductVariant
                                {
                                    Color = color,
                                    Size = size,
                                    Price = price,
                                    CostPrice = costPrice,
                                    Instock = stock
                                });
                            }
                        }

                        newProducts.Add(product);
                        existingProductNames.Add(productName);
                    }
                    totalFetched += productsArray.Count;
                    page++; // Chuyển sang trang tiếp theo

                    // Nghỉ 1 chút giữa các request để tránh bị server block (Polite Scraping)
                    await Task.Delay(500);
                }

                // NHẬP KHO HÀNG LOẠT (Bulk Insert)
                if (newProducts.Any())
                {
                    _context.products.AddRange(newProducts);
                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = $"Thành công! Đã quét {totalFetched} SP từ nguồn, lưu mới {newProducts.Count} sản phẩm." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
            }
        }
    }
}