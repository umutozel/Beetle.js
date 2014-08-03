using System.Linq;
using System.Web.Http;
using Beetle.Samples.Todo.Angular.Models;
using Beetle.Server.EntityFramework;
using Beetle.Server.WebApi;

namespace Beetle.Samples.Todo.Angular.Controllers {

    public class TodoController: BeetleApiController<EFContextHandler<TodoEntities>> {

        [HttpGet]
        public IQueryable<Models.Todo> Todos() {
            return ContextHandler.Context.Todos;
        }
    }
}