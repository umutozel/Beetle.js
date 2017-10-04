using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.ValueGeneration;

namespace Beetle.Tests.IntegrationCore.Models {

    public class TestEntities : DbContext {

        public TestEntities(DbContextOptions options) : base(options) {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder) {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Entity>().Property(e => e.ShortId).HasValueGenerator<IntGenerator>();
            modelBuilder.Entity<Order>().Property(o => o.Id).ValueGeneratedNever();
            modelBuilder.Entity<OrderDetail>().Property(od => od.Id).ValueGeneratedNever();
        }

        public DbSet<Entity> Entities { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<NamedEntity> NamedEntities { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<NamedEntityType> NamedEntityTypes { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<Order> Orders { get; set; }
    }

    public class IntGenerator: ValueGenerator<int> {
        private static int _nextValue = 1;

        public override bool GeneratesTemporaryValues => false;

        public override int Next(EntityEntry entry) {
            return _nextValue++;
        }
    }
}
