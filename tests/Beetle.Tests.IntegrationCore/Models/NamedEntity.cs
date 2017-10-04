using System;
using System.Collections.Generic;

namespace Beetle.Tests.IntegrationCore.Models {

    public partial class NamedEntity : Entity {

        public NamedEntity() {
            Children = new HashSet<NamedEntity>();
        }

        public Guid NamedEntityTypeId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid? NamedEntityId_Parent { get; set; }

        public virtual NamedEntityType NamedEntityType { get; set; }
        public virtual ICollection<NamedEntity> Children { get; set; }
        public virtual NamedEntity Parent { get; set; }
    }
}
