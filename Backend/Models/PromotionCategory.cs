using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Models
{
    [Table("PromotionCategories")]
    public class PromotionCategory
    {
        public int PromotionId { get; set; }
        public Promotion Promotion { get; set; }

        public int CategoryId { get; set; }
        public Category Category { get; set; }
    }
}
