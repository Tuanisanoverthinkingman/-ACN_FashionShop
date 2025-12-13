using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    public enum PaymentStatus
    {
        Pending,
        Paid,
        Failed,
        Refunded,
        Cancelled
    }

    [Table("payments")]

    public class Payment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PaymentId { get; set; }

        [Required]
        public int OrderId { get; set; }

        [ForeignKey("OrderId")]
        public Order Order { get; set; }

        [Required]
        public string PaymentMethod { get; set; } // "COD" hoặc "BankTransfer"

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; } // Số tiền thanh toán (có thể giống TotalAmount bên Order)

        [Required]
        public PaymentStatus Status { get; set; } // "Pending", "Paid", "Failed", "Refunded", v.v.

        [Required]
        public string Address { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime CreateAt { get; set; } = DateTime.UtcNow;
        public int? PromoId { get; set; }
        [ForeignKey("PromoId")]
        public Promotion? Promotion { get; set; }
    }
}