using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("UserPromotions")]
    public class UserPromotion
    {
        public int UserId { get; set; }
        public User User { get; set; }
        public int PromotionId { get; set; }
        public Promotion Promotion { get; set; }
        public bool IsUsed { get; set; } = false;
        public DateTime ?UsedAt { get; set; }
    }
}