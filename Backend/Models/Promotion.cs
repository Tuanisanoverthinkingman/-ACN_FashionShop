using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    public enum PromotionStatus
    {
        Active,
        Expired
    }
    [Table("Promotions")]
    public class Promotion
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PromotionId { get; set; }

        [Required]
        public string Code { get; set; }

        [Required]
        public double DiscountPercent { get; set; }

        [Required]
        public PromotionApplyType ApplyType { get; set; }

        public string Description { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public PromotionStatus Status { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        public ICollection<UserPromotion> UserPromotions { get; set; }
            = new List<UserPromotion>();

        public ICollection<PromotionCategory> PromotionCategories { get; set; }
            = new List<PromotionCategory>();

        public ICollection<PromotionProduct> PromotionProducts { get; set; }
            = new List<PromotionProduct>();
    }

}