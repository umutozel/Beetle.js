using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;

namespace Beetle.Tests.IntegrationCore.Controllers {
    using Server;
    using MvcCore;
    using Models;
    using System.Threading.Tasks;
    using Newtonsoft.Json;

    public sealed class HomeController : BeetleController {

        public HomeController() {
            CheckRequestHash = true;
        }

        public IActionResult Index() {
            return View();
        }

        protected override Task<SaveResult> SaveChanges(SaveContext saveContext) {
            return Task.FromResult(SaveResult.Empty);
        }

        public IQueryable<Entity> Entities() {
            var s = JsonConvert.SerializeObject(null);
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
