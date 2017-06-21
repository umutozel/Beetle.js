using System.Collections.Generic;

namespace Beetle.Server {

    public class SaveContext {

        public HashSet<object> GeneratedEntities { get; } = new HashSet<object>();

        public object UserData { get; set; }
    }
}
