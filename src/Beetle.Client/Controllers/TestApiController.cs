using System.Linq;
using System.Web.Http;
using Giver;

namespace Beetle.Client.Controllers {
    using WebApi;
    using Models;

    public class TestApiController : BeetleApiController {

        [HttpGet]
        public IQueryable<Entity> Entities() {
            return Give<Entity>.Many(30).AsQueryable();
        }
    }
}