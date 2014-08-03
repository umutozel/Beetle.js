using System.Linq;
using System.Web.Http;
using Beetle.Samples.Todo.Knockout.Models;
using Beetle.Server.EntityFramework;
using Beetle.Server.WebApi;

namespace Beetle.Samples.Todo.Knockout.Controllers {

    public class TodoController: BeetleApiController<EFContextHandler<TodoEntities>> {

        [HttpGet]
        public IQueryable<Models.Todo> Todos() {
            return ContextHandler.Context.Todos;
        }
    }
}