using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("products")]
    public class Product
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(255)]
        [Column(TypeName = "nvarchar(255)")]
        public string Name { get; set; }

        [Column(TypeName = "longtext")]
        public string Description { get; set; }

        [Column(TypeName = "longtext")]
        public string? ImageUrl { get; set; }

        public bool IsDeleted { get; set; } = false;

        [Required]
        [ForeignKey("Category")]
        public int CategoryId { get; set; }
        public Category? Category { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime CreateAt { get; set; } = DateTime.UtcNow;

        //Liên kết 1 - N tới bảng ProductVariant
        public ICollection<ProductVariant> ProductVariants { get; set; } = new List<ProductVariant>();

        public ICollection<PromotionProduct> PromotionProducts { get; set; }
        public ICollection<Feedback> Feedbacks { get; set; }
    }
}