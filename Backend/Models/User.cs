using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("users")]
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        [Column(TypeName = "varchar(50)")]
        public string Username { get; set; }

        [Required]
        [StringLength(30)]
        [Column(TypeName = "varchar(255)")]
        public string Password { get; set; }

        [Required]
        [StringLength(30)]
        [Column(TypeName = "nvarchar(30)")]
        public string FullName { get; set; }

        [Required]
        [Column(TypeName = "varchar(30)")]
        public string Role { get; set; } // Admin, Người dùng

        [Required]
        [Column(TypeName = "varchar(100)")]
        public string Email { get; set; }

        [Required]
        [StringLength(20)]
        [Column(TypeName = "varchar(20)")]
        public string Phone { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime CreateAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;
    }
}