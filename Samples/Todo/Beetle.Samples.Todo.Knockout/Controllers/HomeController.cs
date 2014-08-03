using System.Linq;
using System.Web.Mvc;
using Beetle.Samples.Todo.Knockout.Models;
using Beetle.Server.EntityFramework;
using Beetle.Server.Mvc;

namespace Beetle.Samples.Todo.Knockout.Controllers {

    public class HomeController : BeetleController<EFContextHandler<TodoEntities>> {

        public ActionResult Index() {
            return View();
        }

        public IQueryable<Models.Todo> Todos() {
            return ContextHandler.Context.Todos;
        }
    }
}
