using Microsoft.AspNetCore.Mvc;

namespace Beetle.ClientCore.Controllers {

    public class HomeController : Controller {

        public IActionResult Index() {
            return View();
        }
    }
}
