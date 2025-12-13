using Microsoft.EntityFrameworkCore;
using Models;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> users { get; set; }
    public DbSet<Category> categories { get; set; }
    public DbSet<Product> products { get; set; }
    public DbSet<CartItem> cartItems { get; set; }
    public DbSet<Order> orders { get; set; }
    public DbSet<OrderDetail> orderDetails { get; set; }
    public DbSet<Payment> payments { get; set; }
    public DbSet<Promotion> promotions { get; set; }
    public DbSet<UserPromotion> userPromotions { get; set; }
    public DbSet<PromotionCategory> promotionCategories { get; set; }
    public DbSet<PromotionProduct> promotionProducts { get; set; }
    public DbSet<EmailVerification> EmailVerifications { get; set; }
    public DbSet<Feedback> Feedbacks { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Product → Category
        modelBuilder.Entity<Product>()
            .HasOne(p => p.Category)
            .WithMany()
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Promotion <-> Product (many-to-many)
        modelBuilder.Entity<PromotionProduct>()
            .HasKey(pp => new { pp.PromotionId, pp.ProductId });

        modelBuilder.Entity<PromotionProduct>()
            .HasOne(pp => pp.Promotion)
            .WithMany(p => p.PromotionProducts)
            .HasForeignKey(pp => pp.PromotionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PromotionProduct>()
            .HasOne(pp => pp.Product)
            .WithMany(p => p.PromotionProducts)
            .HasForeignKey(pp => pp.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Promotion <-> Category (many-to-many)
        modelBuilder.Entity<PromotionCategory>()
            .HasKey(pc => new { pc.PromotionId, pc.CategoryId });

        modelBuilder.Entity<PromotionCategory>()
            .HasOne(pc => pc.Promotion)
            .WithMany(p => p.PromotionCategories)
            .HasForeignKey(pc => pc.PromotionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PromotionCategory>()
            .HasOne(pc => pc.Category)
            .WithMany(c => c.PromotionCategories)
            .HasForeignKey(pc => pc.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        // UserPromotion
        modelBuilder.Entity<UserPromotion>()
            .HasKey(up => new { up.UserId, up.PromotionId });

        modelBuilder.Entity<UserPromotion>()
            .HasOne(up => up.User)
            .WithMany(u => u.UserPromotions)
            .HasForeignKey(up => up.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserPromotion>()
            .HasOne(up => up.Promotion)
            .WithMany(p => p.UserPromotions)
            .HasForeignKey(up => up.PromotionId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Feedback>()
            .HasOne(f => f.User)
            .WithMany(u => u.Feedbacks)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Feedback → Product
        modelBuilder.Entity<Feedback>()
            .HasOne(f => f.Product)
            .WithMany(p => p.Feedbacks)
            .HasForeignKey(f => f.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}