using System.Collections.Generic;

namespace Beetle.Tests.IntegrationCore.Models {

    public partial class Address : Entity {
        public Address() {
            Companies = new HashSet<Company>();
        }

        public string Country { get; set; }
        public string City { get; set; }
        public string PostalCode { get; set; }
        public int? DoorNumber { get; set; }
        public string Extra { get; set; }
        public string Extra2 { get; set; }

        public virtual ICollection<Company> Companies { get; set; }
    }
}
