using System.Collections.Generic;

namespace Beetle.Tests.IntegrationCore.Models {

    public partial class NamedEntityType {

        public NamedEntityType() {
            NamedEntities = new HashSet<NamedEntity>();
        }

        public System.Guid Id { get; set; }
        public string Name { get; set; }

        public virtual ICollection<NamedEntity> NamedEntities { get; set; }
    }
}
