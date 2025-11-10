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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Product → Category
        modelBuilder.Entity<Product>()
            .HasOne(p => p.Category)
            .WithMany()
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Product → User
        modelBuilder.Entity<Product>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Category → User
        modelBuilder.Entity<Category>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}