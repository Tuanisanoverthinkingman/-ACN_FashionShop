// DTO (Data Transfer Object) - Dữ liệu thô cào về
public class ScrapedProduct
{
    public string Name { get; set; }
    public string FullUrl { get; set; }
    public string ImageUrl { get; set; }
    public decimal SalePrice { get; set; }     // Giá bán (sau khi fix)
    public decimal RegularPrice { get; set; }  // Giá gốc (bị gạch)
    public string SourceSection { get; set; } // Tên Category (vd: "Sản phẩm mới")
    public string Description { get; set; }   // Mô tả (lấy từ trang chi tiết)
}