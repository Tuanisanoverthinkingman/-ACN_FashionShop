using PuppeteerSharp; 
using System.Globalization;
using System.Collections.Generic;
using System.Threading.Tasks;

public class YameScraperService : IAsyncDisposable 
{
    private const string BaseUrl = "https://yame.vn";
    private readonly Random _random = new Random();
    private readonly Lazy<Task<IBrowser>> _browser;
    private const string UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36";

    public YameScraperService()
    {
        _browser = new Lazy<Task<IBrowser>>(async () =>
        {
            // Tải trình duyệt (nếu cần)
            await new BrowserFetcher().DownloadAsync();
            return await Puppeteer.LaunchAsync(new LaunchOptions
            {
                Headless = true, 
                Args = new[] { "--no-sandbox" }
            });
        });
    }

    // Hàm dọn dẹp trình duyệt khi service bị hủy
    public async ValueTask DisposeAsync()
    {
        if (_browser.IsValueCreated)
        {
            var browser = await _browser.Value;
            await browser.CloseAsync();
        }
    }

    private decimal ParsePrice(string priceString)
    {
        priceString = priceString.Replace("VND", "").Replace(".", "").Trim();
        decimal.TryParse(priceString, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal price);
        return price;
    }

    // --- HÀM 1: LẤY DANH SÁCH TỪ TRANG CHỦ (ĐÃ SỬA THEO HTML MỚI) ---
    public async Task<List<ScrapedProduct>> GetHomepageProductsAsync()
    {
        var products = new List<ScrapedProduct>();
        var browser = await _browser.Value;
        await using var page = await browser.NewPageAsync();

        try
        {
            await page.SetUserAgentAsync(UserAgent);
            await page.GoToAsync(BaseUrl, WaitUntilNavigation.Networkidle2);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Lỗi khi tải trang chủ bằng Puppeteer: {ex.Message}");
            return products;
        }

        // === SỬA LỖI CATEGORY: Dùng selector mới dựa trên HTML bạn cung cấp ===
        
        // 1. Tìm tất cả các "div" chứa CẢ tiêu đề (h2.title) VÀ lưới sản phẩm (ul.product-grid)
        var sections = await page.QuerySelectorAllAsync("div[class*='collection']:has(h2.title):has(ul.product-grid)");

        foreach (var section in sections)
        {
            string sectionTitle = "Chưa phân loại";
            
            // 2. Lấy tiêu đề từ trong section (h2.title)
            var titleNode = await section.QuerySelectorAsync("h2.title");
            if(titleNode != null)
            {
                sectionTitle = await titleNode.EvaluateFunctionAsync<string>("e => e.innerText.trim()");
                await titleNode.DisposeAsync();
            }
            
            // 3. Lấy lưới sản phẩm từ trong section
            var grid = await section.QuerySelectorAsync("ul.product-grid");
            if (grid == null) continue;

            // 4. Lấy từng sản phẩm
            var productItems = await grid.QuerySelectorAllAsync("li.grid__item");
            if (productItems == null) continue;

            foreach (var item in productItems)
            {
                // Dùng CSS selector cho tất cả
                var headingNode = await item.QuerySelectorAsync("h3.card__heading > a");
                if (headingNode == null) continue;
                
                string name = await headingNode.EvaluateFunctionAsync<string>("e => e.innerText.trim()");
                string relativeUrl = await headingNode.EvaluateFunctionAsync<string>("e => e.getAttribute('href')");

                var imgNode = await item.QuerySelectorAsync("img.motion-reduce");
                string imageUrl = imgNode != null ? await imgNode.EvaluateFunctionAsync<string>("e => e.getAttribute('src')") : "N/A";
                if (imageUrl != null && imageUrl.StartsWith("//")) imageUrl = "https:" + imageUrl;

                // --- LOGIC LẤY GIÁ (Dùng CSS Selector) ---
                // HTML bạn gửi cho thấy có 2 giá:
                // 1. Giá bán (sale): span.price-item--sale
                // 2. Giá gốc (bị gạch): s.price-item--regular
                
                var salePriceNode = await item.QuerySelectorAsync("span.price-item--sale");
                var regularPriceNode = await item.QuerySelectorAsync("s.price-item--regular");
                
                string salePriceStr;
                string regularPriceStr;

                if (salePriceNode != null && regularPriceNode != null)
                {
                    // Trường hợp CÓ GIẢM GIÁ
                    salePriceStr = await salePriceNode.EvaluateFunctionAsync<string>("e => e.innerText.trim()");
                    regularPriceStr = await regularPriceNode.EvaluateFunctionAsync<string>("e => e.innerText.trim()");
                }
                else
                {
                    // Trường hợp KHÔNG GIẢM GIÁ (chỉ có 1 giá)
                    var currentPriceNode = await item.QuerySelectorAsync("span.price-item--regular");
                    salePriceStr = currentPriceNode != null ? await currentPriceNode.EvaluateFunctionAsync<string>("e => e.innerText.trim()") : "0 VND";
                    regularPriceStr = salePriceStr; // Giá gốc bằng giá bán
                    
                    if(currentPriceNode != null) await currentPriceNode.DisposeAsync();
                }

                decimal salePrice = ParsePrice(salePriceStr);
                decimal regularPrice = ParsePrice(regularPriceStr);
                
                if (salePriceNode != null) await salePriceNode.DisposeAsync();
                if (regularPriceNode != null) await regularPriceNode.DisposeAsync();
                // --- KẾT THÚC LOGIC GIÁ ---

                products.Add(new ScrapedProduct
                {
                    Name = name,
                    FullUrl = BaseUrl + relativeUrl,
                    ImageUrl = imageUrl,
                    SalePrice = salePrice, // Giá này là giá bán (đã fix)
                    RegularPrice = regularPrice,
                    SourceSection = sectionTitle, // Gán tên Category đã tìm được
                    Description = null 
                });

                // Dọn dẹp
                await headingNode.DisposeAsync();
                if (imgNode != null) await imgNode.DisposeAsync();
            }
            await grid.DisposeAsync();
        }
        return products;
    }

    // --- HÀM 2: LẤY CHI TIẾT SẢN PHẨM (ĐÃ SỬA) ---
    public async Task<ScrapedProduct> GetProductDetailsAsync(ScrapedProduct product)
    {
        if (string.IsNullOrEmpty(product.FullUrl) || product.FullUrl == BaseUrl)
        {
            product.Description = "Không tìm thấy URL chi tiết.";
            return product;
        }

        var browser = await _browser.Value; 
        await using var page = await browser.NewPageAsync();

        try
        {
            await page.SetUserAgentAsync(UserAgent);
            await page.GoToAsync(product.FullUrl, WaitUntilNavigation.Networkidle2);

            // === SỬA LỖI DESCRIPTION: Dùng selector tìm 1 trong 2 class ===
            // (Lấy từ gợi ý XPath gốc của bạn)
            var descriptionNode = await page.QuerySelectorAsync(
                "div.product__description, div.product-description"
            );
            
            if (descriptionNode != null)
            {
                product.Description = await descriptionNode.EvaluateFunctionAsync<string>("e => e.innerHTML.trim()");
                await descriptionNode.DisposeAsync();
            }
            else
            {
                product.Description = product.Name;
            }
        }
        catch (Exception ex)
        {
            product.Description = $"Lỗi khi tải trang chi tiết: {ex.Message}";
        }
        
        return product;
    }
}