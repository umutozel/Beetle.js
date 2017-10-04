using System;

namespace Beetle.Meta {

    public abstract class MetadataPart {
        protected MetadataPart(string name, Func<string> displayNameGetter) {
            DisplayNameGetter = displayNameGetter;
            Name = name;
        }

        public string Name { get; set; }
        public string ResourceName { get; set; }

        public virtual string GetDisplayName() {
            if (DisplayNameGetter == null) return null;
            try {
                return DisplayNameGetter();
            }
            catch {
                return null;
            }
        }

        public abstract object ToMinified();

        public Func<string> DisplayNameGetter { get; }
    }
}
