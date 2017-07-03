using System.Linq;
using System.Web.Mvc;
using Beetle.Client.Models;
using Beetle.Mvc;
using Giver;

namespace Beetle.Client.Controllers {

    public class HomeController : BeetleController {

        public ActionResult Index() {
            return View();
        }

        public IQueryable<Entity> Entities() {
            return Give<Entity>.Many(30).AsQueryable();
        }
    }
}