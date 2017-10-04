using System;

namespace Beetle.Tests.IntegrationCore.Models {

    public partial class Company : NamedEntity {
        public Guid? AddressId { get; set; }
        public string CompanyNo { get; set; }
        public CompanyType CompanyType { get; set; }

        public virtual Address Address { get; set; }
    }
}
