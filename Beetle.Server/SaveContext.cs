using System.Collections.Generic;

namespace Beetle.Server {

    public class SaveContext {
        private readonly HashSet<object> _generatedEntities = new HashSet<object>();

        public HashSet<object> GeneratedEntities {
            get { return _generatedEntities; }
        }

        public object UserData { get; set; }
    }
}
