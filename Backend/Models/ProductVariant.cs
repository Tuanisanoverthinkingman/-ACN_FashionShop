using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("product_variants")]
    public class ProductVariant
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [ForeignKey("Product")]
        public int ProductId { get; set; }
        public Product? Product { get; set; }

        [StringLength(50)]
        [Column(TypeName = "nvarchar(50)")]
        public string? Size { get; set; }

        [StringLength(255)]
        [Column(TypeName = "nvarchar(255)")]
        public string? Color { get; set; }

        [Column(TypeName = "longtext")]
        public string? ImageUrl { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal CostPrice { get; set; } 

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; } 

        [NotMapped]
        public decimal Profit => Price - CostPrice;

        [Required]
        [Column(TypeName = "int")]
        public int Instock { get; set; }
    }
}