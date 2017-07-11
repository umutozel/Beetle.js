using System;
using System.Linq;
using Beetle.Server;
using Microsoft.AspNetCore.Mvc;

namespace Beetle.ClientCore.Controllers {
    using MvcCore;
    using Models;

    public sealed class HomeController : BeetleController {

        public HomeController() {
            CheckRequestHash = true;
        }

        public IActionResult Index() {
            return View();
        }

        public IQueryable<Entity> Entities() {
            var rnd = new Random();
            return Enumerable.Range(1, 10)
                .Select(i => new Entity {Id = rnd.Next(20), ShortId = i, TimeCreate = DateTime.Now, UserNameCreate = "tester"})
                .AsQueryable();
        }

        [NonBeetleAction]
        public IQueryable<Entity> Entities2() {
            var rnd = new Random();
            return Enumerable.Range(1, 10)
                .Select(i => new Entity { Id = rnd.Next(20), ShortId = i, TimeCreate = DateTime.Now, UserNameCreate = "tester" })
                .AsQueryable();
        }
    }
}
