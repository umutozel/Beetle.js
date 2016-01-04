using System.Collections.Generic;
using System.Threading.Tasks;
using System.Web.Mvc;
using Beetle.Samples.Northwind.Models;
using Beetle.Server;
using Beetle.Server.EntityFramework;
using Beetle.Server.Mvc;

namespace Beetle.Samples.Northwind.Controllers {

    public class HomeController : BeetleController<EFContextHandler<NorthwindEntities>>  {

        public ActionResult Index() {
            return View();
        }

        public async Task<BeetleContentResult> SaveChangesAsync(object saveBundle) {
            // simulating basic beetle save operation
            IEnumerable<EntityBag> unknowns;
            var entityBags = ResolveEntities(saveBundle, out unknowns);
            IEnumerable<EntityBag> unmappeds;
            ContextHandler.MergeEntities(entityBags, out unmappeds);
            var affectedCount = await ContextHandler.Context.SaveChangesAsync();
            var saveResult = new SaveResult(affectedCount);
            return new BeetleContentResult(saveResult);
        }
    }
}
