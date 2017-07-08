using System;
using Newtonsoft.Json;

namespace Beetle.Server {

    public class SimpleResultConfig: BeetleConfig {
        private static readonly Lazy<SimpleResultConfig> _instance = new Lazy<SimpleResultConfig>();

        public SimpleResultConfig()
            : base(NullValueHandling.Ignore, TypeNameHandling.None, Formatting.None, 
                   ReferenceLoopHandling.Ignore, PreserveReferencesHandling.None) {
        }

        public new static SimpleResultConfig Instance => _instance.Value;
    }
}
