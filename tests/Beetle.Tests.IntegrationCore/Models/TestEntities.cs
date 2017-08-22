using Microsoft.EntityFrameworkCore;

namespace Beetle.Tests.IntegrationCore.Models {

    public class TestEntities : DbContext {

        public TestEntities(DbContextOptions options) : base(options) {
        }

        public DbSet<Entity> Entities { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<NamedEntity> NamedEntities { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<NamedEntityType> NamedEntityTypes { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<Order> Orders { get; set; }
    }
}
