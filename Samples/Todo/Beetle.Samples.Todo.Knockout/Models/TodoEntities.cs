using System.Data.Entity;
using System.Data.Entity.Infrastructure;

namespace Beetle.Samples.Todo.Knockout.Models {

    public class TodoEntities : DbContext {
        
        public TodoEntities(): base("name=TodoEntities") {
        }

        protected override void OnModelCreating(DbModelBuilder modelBuilder) {
            throw new UnintentionalCodeFirstException();
        }

        public DbSet<Todo> Todos { get; set; }
    }
}
