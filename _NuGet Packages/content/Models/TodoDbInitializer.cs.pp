using System.Data.Entity;

namespace $rootnamespace$.Models {

    public class TodoDbInitializer: CreateDatabaseIfNotExists<TodoContext> {
    
		public override void InitializeDatabase(TodoContext context) {
			if (!context.Database.Exists()) {
                context.Database.Create();
            }
        }
		
        protected override void Seed(TodoContext context) {
            context.Todos.Add(new Todo {Title = "Create Knockout Sample Project", Completed = true});
            context.Todos.Add(new Todo {Title = "Create Initializer", Completed = true});
            context.Todos.Add(new Todo {Title = "Add Sample Data", Completed = true});
            context.Todos.Add(new Todo {Title = "Test Run", Completed = true});
            context.Todos.Add(new Todo {Title = "Close All Todos", Completed = true});
            context.SaveChanges();
        }
    }
}
