using System;

namespace Beetle.Tests.IntegrationCore.Models {

    public partial class Entity {
        public Guid Id { get; set; }
        public int ShortId { get; set; }
        public string UserNameCreate { get; set; }
        public DateTime TimeCreate { get; set; }
        public bool? IsCanceled { get; set; }
    }
}
