using System.Data.Entity;

namespace $rootnamespace$.Models {
    
    public class TodoContext : DbContext {

        static TodoContext() {
            Database.SetInitializer(new TodoDbInitializer());
        }

		public DbSet<Todo> Todos { get; set; }
    }
}