using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Beetle.Tests.IntegrationCore.Controllers {
    using Server;
    using EntityFrameworkCore;
    using MvcCore;
    using Models;

    public sealed class HomeController : BeetleController<TestContextHandler> {

        public HomeController(TestContextHandler contextHandler): base(contextHandler) {
            CheckRequestHash = true;
        }

        public TestEntities Context => ContextHandler.Context;

        public override object CreateType(string typeName, string initialValues) {
            return base.CreateType($"Beetle.Tests.IntegrationCore.Models.{typeName}, Beetle.Tests.IntegrationCore", initialValues);
        }

        public IActionResult Index() {
            return View();
        }

        [HttpGet]
        public IQueryable<Entity> Entities() {
            return Context.Entities;
        }

        [HttpGet]
        public IQueryable<NamedEntity> NamedEntities() {
            return Context.NamedEntities;
        }

        [HttpGet]
        public IQueryable<Company> Companies() {
            return Context.Companies;
        }

        [HttpGet]
        public IQueryable<Address> Addresses() {
            return Context.Addresses;
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
        public IQueryable<NamedEntity> TestPost([FromBody]Person person, int shortId, string name, IEnumerable<int> ids) {
            if (name != "Knuth") throw new ArgumentException("name is missing");

            return Context.Entities.OfType<NamedEntity>()
                .Where(ne => ne.ShortId != shortId)
                .Where(ne => ne.Name != person.Name)
                .Where(ne => !ids.Contains(ne.ShortId));
        }

        [HttpPost]
        public Task<SaveResult> UpdateEntity([FromBody]object saveBundle) {
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

    public class TestContextHandler : EFContextHandler<TestEntities> {

        public TestContextHandler(TestEntities context): base(context) {
        }

        public override Task<SaveResult> SaveChanges(SaveContext saveContext) {
            var newOrders = saveContext.Entities
                .Where(e => e.EntityState == EntityState.Added)
                .Select(e => e.Entity)
                .OfType<Order>()
                .ToList();

            if (newOrders.Any()) {
                var allDetails = saveContext.Entities
                    .Select(e => e.Entity)
                    .OfType<OrderDetail>()
                    .ToList();

                var lastOrderId = Context.Orders.Max(o => o.Id);
                var lastDetailId = Context.OrderDetails.Max(od => od.Id);

                foreach (var order in newOrders) {
                    var newOrderId = ++lastOrderId;
                    var orderDetails = allDetails.Where(od => od.OrderId == order.Id);

                    foreach (var orderDetail in orderDetails) {
                        orderDetail.Id = ++lastDetailId;
                        orderDetail.OrderId = newOrderId;
                    }

                    order.Id = newOrderId;
                }
            }

            return base.SaveChanges(saveContext);
        }
    }
}
