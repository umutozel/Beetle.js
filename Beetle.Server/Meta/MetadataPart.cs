using System;

namespace Beetle.Server.Meta {

    public abstract class MetadataPart {
        private readonly Func<string> _displayNameGetter;

        protected MetadataPart(string name, Func<string> displayNameGetter) {
            _displayNameGetter = displayNameGetter;
            Name = name;
        }

        public string Name { get; set; }
        public string ResourceName { get; set; }

        public virtual string GetDisplayName() {
            if (_displayNameGetter != null) {
                try {
                    return _displayNameGetter();
                }
                catch {
                    // ignored
                }
            }
            return null;
        }

        public abstract object ToMinified();

        public Func<string> DisplayNameGetter {
            get { return _displayNameGetter; }
        }
    }
}
