using System;

namespace Beetle.ClientCore.Models {

    public class Entity {
        public int Id { get; set; }
        public int ShortId { get; set; }
        public string UserNameCreate { get; set; }
        public DateTime TimeCreate { get; set; }
        public bool? IsCanceled { get; set; }
    }
}
