using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using Newtonsoft.Json.Linq;
using HtmlAgilityPack;
using System.Text.RegularExpressions;

namespace Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ScraperController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly HttpClient _httpClient;

        public ScraperController(AppDbContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
            _httpClient.Timeout = TimeSpan.FromMinutes(10);
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            _httpClient.DefaultRequestHeaders.Add("Referer", "https://yame.vn");
        }

        [HttpGet("fetch-products")]
        public async Task<IActionResult> FetchProducts()
        {
            try
            {
                var existingCategories = await _context.categories.ToListAsync();
                var categoryDict = existingCategories.ToDictionary(c => c.Name, c => c.Id);

                var dbProducts = await _context.products.Include(p => p.ProductVariants).ToListAsync();
                var newProductsInMemory = new List<Product>();

                int page = 1;
                int totalFetched = 0;
                bool hasMoreData = true;

                while (hasMoreData && totalFetched < 1400)
                {
                    string url = $"https://yame.vn/products.json?limit=250&page={page}";
                    var response = await _httpClient.GetAsync(url);
                    if (!response.IsSuccessStatusCode) break;

                    var content = await response.Content.ReadAsStringAsync();
                    var json = JObject.Parse(content);
                    var productsArray = json["products"] as JArray;

                    if (productsArray == null || !productsArray.Any()) break;

                    foreach (var item in productsArray)
                    {
                        string fullTitle = item["title"]?.ToString() ?? "No Name";

                        string baseName = fullTitle;
                        string[] rácKeywords = { " Màu ", " - ", " | ", " #Y", " Dáng ", " mẫu ", " size ", " F3", " F4" };

                        foreach (var keyword in rácKeywords)
                        {
                            int index = baseName.IndexOf(keyword, StringComparison.OrdinalIgnoreCase);
                            if (index > 0)
                            {
                                baseName = baseName.Substring(0, index);
                            }
                        }
                        baseName = baseName.Trim();

                        string colorKey = "";
                        string sizeKey = "";
                        var options = item["options"] as JArray;
                        if (options != null)
                        {
                            for (int i = 0; i < options.Count; i++)
                            {
                                string optName = options[i]["name"]?.ToString().ToLower() ?? "";
                                if (optName.Contains("màu") || optName.Contains("color")) colorKey = $"option{i + 1}";
                                if (optName.Contains("kích") || optName.Contains("size")) sizeKey = $"option{i + 1}";
                            }
                        }

                        var imagesArray = item["images"] as JArray;
                        string? variantImg = (imagesArray != null && imagesArray.Count > 0)
                                            ? imagesArray[0]["src"]?.ToString() : null;

                        var targetProduct = dbProducts.FirstOrDefault(p => p.Name.Equals(baseName, StringComparison.OrdinalIgnoreCase))
                                          ?? newProductsInMemory.FirstOrDefault(p => p.Name.Equals(baseName, StringComparison.OrdinalIgnoreCase));

                        if (targetProduct == null)
                        {
                            string? rawCategory = item["product_type"]?.ToString();
                            string categoryName = string.IsNullOrWhiteSpace(rawCategory) ? "Khác" : rawCategory.Trim();
                            if (!categoryDict.ContainsKey(categoryName))
                            {
                                var newCat = new Category { Name = categoryName, Description = categoryName };
                                _context.categories.Add(newCat);
                                await _context.SaveChangesAsync();
                                categoryDict[categoryName] = newCat.Id;
                            }

                            string html = item["body_html"]?.ToString() ?? "";
                            var doc = new HtmlDocument(); doc.LoadHtml(html);
                            string plainDescription = doc.DocumentNode.InnerText;
                            if (plainDescription.Length > 4000) plainDescription = plainDescription.Substring(0, 4000);

                            targetProduct = new Product
                            {
                                Name = baseName,
                                Description = plainDescription,
                                ImageUrl = variantImg,
                                CategoryId = categoryDict[categoryName],
                                ProductVariants = new List<ProductVariant>()
                            };
                            newProductsInMemory.Add(targetProduct);
                        }

                        var variantsArray = item["variants"] as JArray;
                        if (variantsArray != null)
                        {
                            foreach (var v in variantsArray)
                            {
                                string colorValue = !string.IsNullOrEmpty(colorKey) ? v[colorKey]?.ToString() : "";
                                string sizeValue = !string.IsNullOrEmpty(sizeKey) ? v[sizeKey]?.ToString() : "";

                                if (string.IsNullOrWhiteSpace(colorValue) || colorValue.ToLower() == "default title")
                                    colorValue = GuessColorFromText(fullTitle);

                                if (string.IsNullOrWhiteSpace(sizeValue))
                                    sizeValue = GuessSizeFromText(fullTitle);

                                colorValue = colorValue.Split('/')[0].Trim();
                                sizeValue = sizeValue.Split('/').Last().Trim();

                                decimal price = decimal.TryParse(v["price"]?.ToString(), out var p) ? p : 0;

                                if (!targetProduct.ProductVariants.Any(pv => pv.Color == colorValue && pv.Size == sizeValue))
                                {
                                    targetProduct.ProductVariants.Add(new ProductVariant
                                    {
                                        Color = colorValue,
                                        Size = sizeValue,
                                        Price = price,
                                        CostPrice = price * 0.7m,
                                        Instock = Random.Shared.Next(20, 100),
                                        ImageUrl = variantImg
                                    });
                                }
                            }
                        }
                    }

                    totalFetched += productsArray.Count;
                    page++;

                    // --- ĐÂY LÀ PHẦN MÌNH THÊM VÀO: LƯU ĐỊNH KỲ ---
                    if (newProductsInMemory.Any())
                    {
                        _context.products.AddRange(newProductsInMemory);
                        await _context.SaveChangesAsync();

                        // Xóa sạch bộ nhớ tạm sau khi đã lưu DB thành công
                        newProductsInMemory.Clear();

                        // Cập nhật lại danh sách gốc để các vòng lặp sau biết sản phẩm đã tồn tại
                        dbProducts = await _context.products.Include(p => p.ProductVariants).ToListAsync();
                    }
                    // ----------------------------------------------

                    await Task.Delay(300);
                }

                // Trả về thông báo thành công (không cần _context.products.AddRange ở đây nữa)
                return Ok(new { message = $"Hoàn tất! Đã quét tổng cộng {totalFetched} biến thể và lưu an toàn vào Database." });
            }
            catch (Exception ex)
            {
                var inner = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Lỗi: {inner}");
            }
        }

        private string GuessColorFromText(string text)
        {
            string[] colors = { "Đen", "Trắng", "Xám", "Đỏ", "Xanh", "Vàng", "Nâu", "Be", "Hồng", "Tím", "Cam", "Rêu" };
            foreach (var color in colors)
            {
                if (text.Contains(color, StringComparison.OrdinalIgnoreCase)) return color;
            }
            return "Mặc định";
        }

        private string GuessSizeFromText(string text)
        {
            string[] commonSizes = { "S", "M", "L", "XL", "XXL", "2XL", "3XL" };
            foreach (var s in commonSizes)
            {
                if (Regex.IsMatch(text, $@"\b{s}\b", RegexOptions.IgnoreCase)) return s;
            }
            return "FreeSize";
        }
    }
}