using System;
using Newtonsoft.Json;

namespace Beetle.Server {

    /// <summary>
    /// Beetle config specifically created to be used in serializing results where type info is not needed (like metadata).
    /// </summary>
    public class SimpleResultConfig: BeetleConfig {
        private static readonly Lazy<SimpleResultConfig> _instance = new Lazy<SimpleResultConfig>();

        /// <summary>
        /// Initializes a new instance of the <see cref="SimpleResultConfig"/> class.
        /// </summary>
        public SimpleResultConfig()
            : base(NullValueHandling.Ignore, TypeNameHandling.None) {
        }

        /// <summary>
        /// Gets the instance.
        /// </summary>
        /// <value>
        /// The instance.
        /// </value>
        public static new SimpleResultConfig Instance {
            get { return _instance.Value; }
        }
    }
}
