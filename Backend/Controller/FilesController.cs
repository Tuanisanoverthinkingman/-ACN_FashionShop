using Microsoft.AspNetCore.Mvc;

namespace Controllers
{
    [ApiController]
    [Route("api/files")]
    public class FileController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

        public FileController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UpLoadImage([FromForm] FileUpLoadRequest request)
        {
            var file = request.File;

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Không có tệp nào được tải lên" });

            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!_allowedExtensions.Contains(extension))
                return BadRequest(new { message = "Định dạng tệp không hỗ trợ." });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "Dung lượng ảnh quá lớn (Tối đa 5MB)" });

            try
            {
                var uploadPath = Path.Combine(_env.WebRootPath, "uploads");
                if (!Directory.Exists(uploadPath)) 
                    Directory.CreateDirectory(uploadPath);

                var fileName = Guid.NewGuid().ToString() + extension;
                var filePath = Path.Combine(uploadPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
                return Ok(new { imageUrl = fileUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lưu file: " + ex.Message });
            }
        }

        // THÊM: Hàm xóa ảnh để dọn dẹp server
        [HttpDelete("delete")]
        public IActionResult DeleteImage([FromQuery] string imageUrl)
        {
            try
            {
                if (string.IsNullOrEmpty(imageUrl)) return BadRequest();

                // Lấy tên file từ URL (ví dụ: http://.../uploads/abc.jpg -> abc.jpg)
                var fileName = Path.GetFileName(imageUrl);
                var filePath = Path.Combine(_env.WebRootPath, "uploads", fileName);

                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    return Ok(new { message = "Xóa file thành công" });
                }

                return NotFound(new { message = "Không tìm thấy file trên server" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi xóa file: " + ex.Message });
            }
        }

        public class FileUpLoadRequest
        {
            public IFormFile File { get; set; } = null!;
        }
    }
}