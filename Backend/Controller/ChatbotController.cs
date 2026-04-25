using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using System.Text.Json;
using System.Text;

namespace Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatbotController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public ChatbotController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
            _httpClient = new HttpClient();
        }

        public class ChatMessageDto
        {
            public string Role { get; set; }
            public string Text { get; set; }
        }

        public class ChatRequest
        {
            public string Message { get; set; }
            public List<ChatMessageDto> History { get; set; } = new List<ChatMessageDto>();
        }

        public class AiFilters
        {
            public string Keyword { get; set; }
            public decimal? MaxPrice { get; set; }
            public string Color { get; set; }
        }

        public class AiResponse
        {
            public string ReplyText { get; set; }
            public AiFilters Filters { get; set; }
        }

        [HttpPost("ask")]
        public async Task<IActionResult> AskBot([FromBody] ChatRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Message))
                return BadRequest("Tin nhắn trống");

            var apiKey = _config["GeminiApiKey"]?.Trim();
            if (string.IsNullOrEmpty(apiKey))
            {
                return Ok(new
                {
                    text = "[LỖI SERVER]: Chưa cấu hình GeminiApiKey",
                    products = new List<object>()
                });
            }

            var geminiUrl = $"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={apiKey}";

            var historyString = "";
            if (req.History != null && req.History.Any())
            {
                var recentHistory = req.History.TakeLast(6);
                historyString = string.Join("\n", recentHistory.Select(h =>
                    $"{(h.Role == "user" ? "Khách" : "Nhân viên")}: {h.Text}"));
            }

            var prompt = $@"
            Bạn là nhân viên tư vấn bán hàng thời trang cực kỳ khéo léo, nhiệt tình của shop quần áo NovaStore.
            
            Lịch sử trò chuyện gần đây (để bạn hiểu ngữ cảnh):
            {historyString}

            Khách hàng vừa nói tiếp: ""{req.Message}""

            Nhiệm vụ của bạn:
            1. Phản hồi khách hàng tự nhiên, dựa vào cả Lịch sử trò chuyện. Nếu khách cung cấp số đo (chiều cao, cân nặng), hãy tư vấn size (S, M, L, XL) phù hợp với sản phẩm họ đang hỏi.
            2. Trích xuất nhu cầu. QUAN TRỌNG: Hãy kết hợp cả câu nói hiện tại và lịch sử để giữ đúng Keyword. (Ví dụ: Lịch sử khách hỏi 'áo thun', câu này khách nói 'mình cao 1m7 nặng 60kg' -> Keyword vẫn phải là 'áo thun').

            BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON SAU, KHÔNG CÓ MÃ MARKDOWN:
            {{
                ""ReplyText"": ""Câu tư vấn của bạn"",
                ""Filters"": {{
                    ""Keyword"": ""tên loại quần áo (ví dụ: áo thun, quần jean). Phải duy trì mạch nói chuyện."",
                    ""MaxPrice"": (số tiền tối đa, null nếu không có),
                    ""Color"": ""màu sắc (để rỗng nếu không có)""
                }}
            }}
            ";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[] { new { text = prompt } }
                    }
                }
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            try
            {
                var response = await _httpClient.PostAsync(geminiUrl, content);
                var aiResult = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return Ok(new
                    {
                        text = $"[LỖI GOOGLE API]: {aiResult}",
                        products = new List<object>()
                    });
                }
                AiResponse aiData = new AiResponse { Filters = new AiFilters() };

                try
                {
                    using var doc = JsonDocument.Parse(aiResult);

                    var aiText = doc.RootElement
                        .GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString();

                    int start = aiText.IndexOf("{");
                    int end = aiText.LastIndexOf("}");

                    if (start >= 0 && end > start)
                        aiText = aiText.Substring(start, end - start + 1);

                    aiData = JsonSerializer.Deserialize<AiResponse>(
                        aiText,
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        }) ?? new AiResponse { Filters = new AiFilters() };

                    if (aiData.Filters == null) aiData.Filters = new AiFilters();
                }
                catch
                {
                    aiData.ReplyText = "Dạ NovaStore đang xử lý yêu cầu của bạn, bạn đợi chút nhé!";
                }

                var query = _context.products
                    .Include(p => p.ProductVariants)
                    .Where(p => !p.IsDeleted);

                if (!string.IsNullOrEmpty(aiData.Filters.Keyword))
                {
                    query = query.Where(p =>
                        p.Name.Contains(aiData.Filters.Keyword) ||
                        p.Description.Contains(aiData.Filters.Keyword));
                }

                if (aiData.Filters.MaxPrice.HasValue)
                {
                    query = query.Where(p =>
                        p.ProductVariants.Any(v => v.Price <= aiData.Filters.MaxPrice.Value));
                }

                if (!string.IsNullOrEmpty(aiData.Filters.Color))
                {
                    query = query.Where(p =>
                        p.ProductVariants.Any(v => v.Color.Contains(aiData.Filters.Color)));
                }

                query = query.OrderByDescending(p => p.ProductVariants.Min(v => v.Price));

                var suggestedProducts = await query
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        Price = p.ProductVariants.Min(v => v.Price),
                        ImageUrl = p.ProductVariants.FirstOrDefault().ImageUrl,
                        Color = p.ProductVariants.FirstOrDefault().Color
                    })
                    .Take(5)
                    .ToListAsync();
                string finalMessage = !string.IsNullOrEmpty(aiData.ReplyText)
                    ? aiData.ReplyText
                    : "Dạ đây là một số mẫu phù hợp với bạn ạ 👇";

                if (!suggestedProducts.Any())
                {
                    finalMessage += "\n\n(Tuy nhiên hiện tại mẫu này bên mình đang tạm hết hàng, mong bạn thông cảm và xem thử các mẫu khác nhé!)";
                }

                return Ok(new
                {
                    text = finalMessage,
                    products = suggestedProducts
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    text = $"[LỖI SYSTEM]: {ex.Message}",
                    products = new List<object>()
                });
            }
        }
    }
}