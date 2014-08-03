using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web.Mvc;
using System.Web.Routing;
using Beetle.Server.EntityFramework;
using Beetle.Server.Mvc;
using $rootnamespace$.Models;

namespace $rootnamespace$.Controllers {

	public class TodoController: BeetleController<EFContextHandler<TodoContext>> {

		protected override void Initialize(RequestContext requestContext) {
            base.Initialize(requestContext);
            // workaround Db Initializer problems.
            try {
                ContextHandler.Context.Database.Initialize(false);
            }
            catch (DataException) {
                if (ContextHandler.Context.Database.Exists()) {
                    try {
                        ContextHandler.Context.Database.Delete();
                    }
                    catch (SqlException) {
                    }
                }

                ContextHandler.Context.Database.Initialize(true);
            }
        }

        [HttpGet]
        public IQueryable<Todo> Todos() {
            return ContextHandler.Context.Todos;
        }

        public ActionResult Index() {
            return View();
        }
    }
}
