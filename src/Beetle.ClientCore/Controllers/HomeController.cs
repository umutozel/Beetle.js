using System;
using System.Linq;
using Beetle.ClientCore.Models;
using Beetle.MvcCore;
using Microsoft.AspNetCore.Mvc;

namespace Beetle.ClientCore.Controllers {

    public class HomeController : BeetleController {

        public IActionResult Index() {
            return View();
        }

        public IQueryable<Entity> Entities() {
            var rnd = new Random();
            return Enumerable.Range(1, 10)
                .Select(i => new Entity {Id = rnd.Next(20), ShortId = i, TimeCreate = DateTime.Now, UserNameCreate = "tester"})
                .AsQueryable();
        }
    }
}
