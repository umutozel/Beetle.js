using System;
using System.Collections;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Beetle.Tests.IntegrationCore.Controllers {
    using Server;
    using EntityFrameworkCore;
    using MvcCore;
    using Models;

    public sealed class HomeController : BeetleController<EFContextHandler<TestEntities>> {

        public HomeController(EFContextHandler<TestEntities> contextHandler): base(contextHandler) {
            CheckRequestHash = true;
        }

        public TestEntities Context => ContextHandler.Context;

        public IActionResult Index() {
            return View();
        }

        [HttpGet]
        public IQueryable<Entity> Entities() {
            return Context.Entities;
        }

        [HttpGet]
        public IQueryable<NamedEntity> NamedEntities() {
            return Context.Entities.OfType<NamedEntity>();
        }

        [HttpGet]
        public IQueryable<Company> Companies() {
            return Context.Entities.OfType<Company>();
        }

        [HttpGet]
        public IQueryable<Address> Addresses() {
            return Context.Entities.OfType<Address>();
        }

        [HttpGet]
        public IQueryable<NamedEntityType> NamedEntityTypes() {
            return Context.NamedEntityTypes;
        }

        [HttpGet]
        public IQueryable<Order> Orders() {
            return Context.Orders;
        }

        [HttpGet]
        public IQueryable<OrderDetail> OrderDetails() {
            return Context.OrderDetails;
        }

        [HttpGet]
        public IQueryable<OrderDetail> Details(Guid? id) {
            return Context.OrderDetails;
        }

        public class Person {
            public string Name { get; set; }
            public string Surname { get; set; }
            public DateTime BirthDate { get; set; }
        }

        [HttpPost]
        public IQueryable<NamedEntity> TestPost(dynamic prms, string name) {
            if (name != "Knuth") throw new ArgumentException("name is missing");

            int shortId = Convert.ToInt32(prms.shortId.ToString());
            string personName = Convert.ToString(prms.person.Name).ToString();
            var ids = ((IEnumerable)prms.ids).OfType<object>().Select(x => Convert.ToInt32(x.ToString()));
            Context.NamedEntities.Include("");
            return Context.Entities.OfType<NamedEntity>()
                .Where(ne => ne.ShortId != shortId)
                .Where(ne => ne.Name != personName)
                .Where(ne => !ids.Contains(ne.ShortId));
        }

        [HttpPost]
        public Task<SaveResult> UpdateEntity(object saveBundle) {
            return SaveChanges(saveBundle);
        }

        [HttpGet]
        public string Clear() {
            DatabaseHelper.ClearDatabase(Context);
            return "clear";
        }

        [HttpGet]
        public string Seed() {
            Clear();
            DatabaseHelper.ClearDatabase(Context);
            DatabaseHelper.SeedDatabase(Context);
            return "seed";
        }
    }
}
