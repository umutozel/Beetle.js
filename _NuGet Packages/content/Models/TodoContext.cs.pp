using System.Data.Entity;

namespace $rootnamespace$.Models {
    
    public class TodoContext : DbContext {

        static TodoContext() {
            Database.SetInitializer(new TodoDbInitializer());
        }

		public TodoContext() {
			Database.Connection.ConnectionString = Database.Connection.ConnectionString.Replace("v12.0", "MSSQLLocalDB");
		}
		
		public DbSet<Todo> Todos { get; set; }
    }
}