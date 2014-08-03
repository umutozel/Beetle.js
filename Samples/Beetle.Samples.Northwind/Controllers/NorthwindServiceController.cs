using System.Linq;
using System.Web.Http;
using Beetle.Samples.Northwind.Models;
using Beetle.Server.EntityFramework;
using Beetle.Server.WebApi;

namespace Beetle.Samples.Northwind.Controllers {

    /// <summary>
    /// Beetle web api controller for qunit tests
    /// </summary>
    public class NorthwindServiceController : BeetleApiController<EFContextHandler<NorthwindEntities>> {

        [HttpGet]
        public IQueryable<Customer> Customers() {
            return ContextHandler.Context.Customers;
        }

        [HttpGet]
        public IQueryable<Order_Detail> OrderDetails() {
            return ContextHandler.Context.Order_Details;
        }

        [HttpGet]
        public IQueryable<Order> Orders() {
            return ContextHandler.Context.Orders;
        }
    }
}
