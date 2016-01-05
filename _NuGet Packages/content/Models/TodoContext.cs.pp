using System.Data.Entity;

namespace $rootnamespace$.Models {
    
    public class TodoContext : DbContext {

        static TodoContext() {
            Database.SetInitializer(new TodoDbInitializer());
        }

		public TodoContext() {
            var cs = Database.Connection.ConnectionString;
            cs = cs.Replace("Data Source=.", "Data Source=(localdb)");
            cs = cs.Replace("v12.0", "MSSQLLocalDB");
            cs = cs.Replace("v13.0", "MSSQLLocalDB");
            cs = cs.Replace("SQLEXPRESS", "MSSQLLocalDB");
            Database.Connection.ConnectionString = cs;
		}
		
		public DbSet<Todo> Todos { get; set; }
    }
}