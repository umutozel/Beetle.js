using System;
using Newtonsoft.Json;

namespace Beetle.WebApi {

    public class SimpleResultApiConfig : BeetleApiConfig {
        private static readonly Lazy<SimpleResultApiConfig> _instance = new Lazy<SimpleResultApiConfig>();

        public SimpleResultApiConfig()
            : base(NullValueHandling.Ignore, TypeNameHandling.None, Formatting.None, 
                   ReferenceLoopHandling.Ignore, PreserveReferencesHandling.None) {
        }

        public new static SimpleResultApiConfig Instance => _instance.Value;
    }
}
