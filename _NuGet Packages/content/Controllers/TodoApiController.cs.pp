using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web.Http;
using System.Web.Http.Controllers;
using Beetle.Server.EntityFramework;
using Beetle.Server.WebApi;
using $rootnamespace$.Models;

namespace $rootnamespace$.Controllers {

    public class TodoApiController: BeetleApiController<EFContextHandler<TodoContext>> {
	
        protected override void Initialize(HttpControllerContext controllerContext) {
            base.Initialize(controllerContext);
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
    }
}