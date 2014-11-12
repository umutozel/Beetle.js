using System.Collections.Generic;

namespace Beetle.Server {

    /// <summary>
    /// Hold save data through all save process.
    /// </summary>
    public class SaveContext {
        private readonly HashSet<object> _generatedEntities = new HashSet<object>();

        /// <summary>
        /// Gets the generated entities.
        /// </summary>
        /// <value>
        /// The generated entities.
        /// </value>
        public HashSet<object> GeneratedEntities {
            get { return _generatedEntities; }
        }

        /// <summary>
        /// Gets or sets the user data.
        /// </summary>
        /// <value>
        /// The user data.
        /// </value>
        public object UserData { get; set; }
    }
}
