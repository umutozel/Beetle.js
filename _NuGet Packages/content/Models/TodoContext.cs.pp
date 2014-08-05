using System.Data.Entity;

namespace $rootnamespace$.Models {
    
    public class TodoContext : DbContext {

        static TodoContext() {
            Database.SetInitializer(new TodoDbInitializer());
        }

		public TodoContext() {
            Database.Connection.ConnectionString = Database.Connection.ConnectionString.Replace("Data Source=.", "Data Source=(localdb)");
            Database.Connection.ConnectionString = Database.Connection.ConnectionString.Replace("v12.0", "MSSQLLocalDB");
            Database.Connection.ConnectionString = Database.Connection.ConnectionString.Replace("SQLEXPRESS", "MSSQLLocalDB");
		}
		
		public DbSet<Todo> Todos { get; set; }
    }
}