using System.Collections.Generic;

namespace Beetle.Tests.IntegrationCore.Models {

    public partial class Order {

        public Order() {
            OrderDetails = new HashSet<OrderDetail>();
        }

        public int Id { get; set; }
        public string OrderNo { get; set; }
        public double Price { get; set; }

        public virtual ICollection<OrderDetail> OrderDetails { get; set; }
    }
}
