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
}