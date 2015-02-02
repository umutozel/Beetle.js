using System;

namespace Beetle.Server.Meta {

    /// <summary>
    /// Metadata base representation.
    /// </summary>
    public abstract class MetadataPart {
        private readonly Func<string> _displayNameGetter;

        protected MetadataPart(string name, Func<string> displayNameGetter) {
            _displayNameGetter = displayNameGetter;
            Name = name;
        }

        public string Name { get; set; }
        public string ResourceName { get; set; }

        public virtual string GetDisplayName() {
            if (_displayNameGetter == null) return Name;

            try {
                return _displayNameGetter();
            }
            catch {
                return Name;
            }
        }

        /// <summary>
        /// Converts metadata part to minified object (to consume less space when serialized).
        /// </summary>
        /// <returns>Anonymous object.</returns>
        public abstract object ToMinified();

        /// <summary>
        /// Gets the display name getter.
        /// </summary>
        /// <value>
        /// The display name getter.
        /// </value>
        protected Func<string> DisplayNameGetter {
            get { return _displayNameGetter; }
        }
    }
}
