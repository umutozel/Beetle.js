namespace Beetle.Server {

    /// <summary>
    /// Holds auto-generated values
    /// </summary>
    public class GeneratedValue {
        private readonly int _index;
        private readonly string _property;

        /// <summary>
        /// Initializes a new instance of the <see cref="GeneratedValue" /> class.
        /// </summary>
        /// <param name="index">The index.</param>
        /// <param name="property">The property.</param>
        /// <param name="value">The value.</param>
        public GeneratedValue(int index, string property, object value) {
            _index = index;
            _property = property;
            Value = value;
        }

        /// <summary>
        /// Gets the index in the client array.
        /// </summary>
        /// <value>
        /// The index.
        /// </value>
        public int Index {
            get { return _index; }
        }

        /// <summary>
        /// Gets the property.
        /// </summary>
        /// <value>
        /// The property.
        /// </value>
        public string Property {
            get { return _property; }
        }

        /// <summary>
        /// Gets the generated value.
        /// </summary>
        /// <value>
        /// The value.
        /// </value>
        public object Value { get; set; }
    }
}
