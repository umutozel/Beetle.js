using System;
using System.Collections.Generic;
using System.Globalization;

namespace Beetle.Tests.IntegrationCore.Models {

    public static class DatabaseHelper {
        private static readonly Random _random = new Random();

        /// <summary>
        /// Seeds the database.
        /// </summary>
        /// <param name="context">The context.</param>
        public static void SeedDatabase(TestEntities context) {
            // Create some data for tests.
            var nets = new List<NamedEntityType> {
                                 CreateNamedEntityType(1),
                                 CreateNamedEntityType(2),
                                 CreateNamedEntityType(3)
                             };
            var nes = new List<NamedEntity> {
                                CreateNamedEntity(nets[0], 1),
                                CreateNamedEntity(nets[2], 2),
                                CreateNamedEntity(nets[1]),
                                CreateNamedEntity(nets[2]),
                                CreateNamedEntity(nets[1]),
                                CreateNamedEntity(nets[0])
                            };
            var ads = new List<Address> {
                                CreateAddress(),
                                CreateAddress(),
                                CreateAddress()
                            };
            var cs = new List<Company> {
                               CreateLongNoCompany(nets[1]),
                               CreateLongNoCompany(nets[2]),
                               CreateCompany(nets[1]),
                               CreateCompany(nets[2]),
                               CreateCompany(nets[0])
                           };
            var os = new List<Order> {
                               CreateOrder(42),
                               CreateOrder(),
                               CreateOrder()
                           };

            // add created data to context
            nets.ForEach(net => context.NamedEntityTypes.Add(net));
            ads.ForEach(ad => context.Entities.Add(ad));
            nes.ForEach(ne => context.Entities.Add(ne));
            cs.ForEach(c => context.Entities.Add(c));
            os.ForEach(o => context.Orders.Add(o));

            // save all data
            context.SaveChanges();
        }

        /// <summary>
        /// Clears the database.
        /// </summary>
        /// <param name="context">The context.</param>
        public static void ClearDatabase(TestEntities context) {
            foreach (var e in context.Entities)
                context.Entities.Remove(e);
            foreach (var net in context.NamedEntityTypes)
                context.NamedEntityTypes.Remove(net);
            foreach (var o in context.Orders)
                context.Orders.Remove(o);
            context.SaveChanges();
        }

        public static NamedEntityType CreateNamedEntityType(int id) {
            return new NamedEntityType {
                Id = Guid.NewGuid(),
                Name = "NE_" + id
            };
        }

        public static Address CreateAddress() {
            return new Address {
                Id = Guid.NewGuid(),
                UserNameCreate = "Tester_" + _random.Next(1, 10),
                TimeCreate = DateTime.UtcNow,
                IsCanceled = _random.Next(0, 1) != 0,
                Country = "Country_" + _random.Next(1, 100),
                City = "City_" + _random.Next(1, 100),
                PostalCode = _random.Next(1, 999999).ToString(CultureInfo.InvariantCulture).PadLeft(6, '0')
            };
        }

        public static NamedEntity CreateNamedEntity(NamedEntityType net, NamedEntity existing) {
            return CreateNamedEntity(net, existing, null);
        }

        public static NamedEntity CreateNamedEntity(NamedEntityType net, int? initial = null) {
            return CreateNamedEntity(net, null, initial);
        }

        public static NamedEntity CreateNamedEntity(NamedEntityType net, NamedEntity existing, int? initial) {
            var ne = existing ?? new NamedEntity();
            ne.Id = Guid.NewGuid();
            ne.UserNameCreate = "Tester_" + _random.Next(3, 10);
            ne.TimeCreate = DateTime.UtcNow;
            ne.IsCanceled = _random.Next(0, 1) != 0;
            ne.Description = "Description_" + _random.Next(3, 100);
            ne.Name = "Name_" + (initial.HasValue ? initial : _random.Next(3, 100));
            ne.NamedEntityType = net;
            return ne;
        }

        public static Company CreateLongNoCompany(NamedEntityType net) {
            var c = CreateCompany(net);
            c.CompanyNo += "_long";
            return c;
        }

        public static Company CreateCompany(NamedEntityType net) {
            var c = new Company();
            CreateNamedEntity(net, c);
            c.CompanyNo = "CompanyNo_" + _random.Next(1, 100);
            c.CompanyType = (CompanyType)_random.Next(1, 3);
            c.Address = CreateAddress();
            return c;
        }

        public static Order CreateOrder(decimal? price = null) {
            var o = new Order();
            o.OrderNo = "OrderNo_" + _random.Next(1, 100);
            o.Price = price ?? (decimal)(_random.Next(10000 - 42) + 42);
            o.OrderDetails.Add(CreateOrderDetailWithoutProductNo());
            o.OrderDetails.Add(CreateOrderDetail());
            return o;
        }

        public static OrderDetail CreateOrderDetailWithoutProductNo() {
            var od = CreateOrderDetail();
            od.ProductNo = null;
            return od;
        }

        public static OrderDetail CreateOrderDetail() {
            var od = new OrderDetail();
            od.ProductNo = "ProductNo_" + _random.Next(1, 100);
            return od;
        }
    }
}
