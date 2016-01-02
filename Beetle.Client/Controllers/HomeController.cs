using System;
using System.Collections;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Mvc;
using Beetle.Client.Models;
using Beetle.Server;
using Beetle.Server.EntityFramework;
using Beetle.Server.Mvc;

namespace Beetle.Client.Controllers {

    public class HomeController : BeetleController<EFContextHandler<TestEntities>> {

        public ActionResult Index() {
            return View();
        }

        [HttpGet]
        public IQueryable<Entity> Entities() {
            return ContextHandler.Context.Entities;
        }

        [HttpGet]
        public IQueryable<NamedEntity> NamedEntities() {
            return ContextHandler.Context.Entities.OfType<NamedEntity>();
        }

        [HttpGet]
        public IQueryable<Company> Companies() {
            return ContextHandler.Context.Entities.OfType<Company>();
        }

        [HttpGet]
        public IQueryable<Address> Addresses() {
            return ContextHandler.Context.Entities.OfType<Address>();
        }

        [HttpGet]
        public IQueryable<NamedEntityType> NamedEntityTypes() {
            return ContextHandler.Context.NamedEntityTypes;
        }

        [HttpGet]
        public IQueryable<Order> Orders() {
            return ContextHandler.Context.Orders;
        }

        [HttpGet]
        public IQueryable<OrderDetail> OrderDetails() {
            return ContextHandler.Context.OrderDetails;
        }

        [HttpGet]
        public IQueryable<OrderDetail> Details(Guid? id) {
            return ContextHandler.Context.OrderDetails;
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
            return ContextHandler.Context.Entities.OfType<NamedEntity>()
                .Where(ne => ne.ShortId != shortId)
                .Where(ne => ne.Name != personName)
                .Where(ne => !ids.Contains(ne.ShortId));
        }

        [HttpPost]
        [ValidateJsonAntiForgeryToken]
        public Task<BeetleContentResult<SaveResult>> UpdateEntity(object saveBundle) {
            return SaveChanges(saveBundle);
        }

        /// <summary>
        /// Clears the database.
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        public string Clear() {
            TestDatabaseInitializer.ClearDatabase(ContextHandler.Context);
            return "clear";
        }

        /// <summary>
        /// Seeds the database.
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        public string Seed() {
            Clear();
            TestDatabaseInitializer.SeedDatabase(ContextHandler.Context);
            return "seed";
        }
    }
}