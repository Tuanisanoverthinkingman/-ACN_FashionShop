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
        public string PaymentMethod { get; set; } 

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; } 

        [Required]
        public PaymentStatus Status { get; set; } 

        [Required]
        public string Address { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime CreateAt { get; set; } = DateTime.UtcNow;
        public int? PromoId { get; set; }
        [ForeignKey("PromoId")]
        public Promotion? Promotion { get; set; }
    }
}