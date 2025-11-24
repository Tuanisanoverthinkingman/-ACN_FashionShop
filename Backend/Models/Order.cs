using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("orders")]
    public class Order
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int OrderId { get; set; }

        [Required]
        [ForeignKey("User")]
        public int UserId { get; set; }
        public User? User { get; set; }

        [Required]
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        [Required]
        public decimal TotalAmount { get; set; }

        public List<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

        // ===== Thông tin giao hàng =====
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = null!;   // Họ tên người nhận

        [Required]
        [MaxLength(20)]
        public string Phone { get; set; } = null!;      // Số điện thoại

        [Required]
        [MaxLength(250)]
        public string Address { get; set; } = null!;    // Địa chỉ giao hàng

        [MaxLength(500)]
        public string? Note { get; set; }               // Ghi chú (nếu có)
    }
}