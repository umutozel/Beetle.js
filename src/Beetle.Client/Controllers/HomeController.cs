using System.Linq;
using System.Web.Mvc;
using Giver;

namespace Beetle.Client.Controllers {
    using Mvc;
    using Models;

    public class HomeController : BeetleController {

        public ActionResult Index() {
            return View();
        }

        public IQueryable<Entity> Entities() {
            return Give<Entity>.Many(30).AsQueryable();
        }
    }
}