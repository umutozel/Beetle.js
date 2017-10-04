using System.Collections.Generic;

namespace Beetle.Server {

    public class SaveContext {

        public SaveContext(IEnumerable<EntityBag> entities) {
            Entities = entities;
        }

        public IEnumerable<EntityBag> Entities { get; }

        public HashSet<object> GeneratedEntities { get; } = new HashSet<object>();

        public object UserData { get; set; }
    }
}
