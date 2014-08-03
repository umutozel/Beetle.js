namespace Beetle.Server.Meta {

    /// <summary>
    /// Metadata base representation.
    /// </summary>
    public abstract class MetadataPart {

        protected MetadataPart(string name) {
            Name = name;
        }

        public string Name { get; set; }
        public string ResourceName { get; set; }
        public string DisplayName { get; set; }
        /// <summary>
        /// Converts metadata part to minified object (to consume less space when serialized).
        /// </summary>
        /// <returns>Anonymous object.</returns>
        public abstract object ToMinified();
    }
}
