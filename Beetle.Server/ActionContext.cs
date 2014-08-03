using System.Collections.Specialized;

namespace Beetle.Server {

    /// <summary>
    /// Holds Action data.
    /// </summary>
    public struct ActionContext {
        private readonly string _name;
        private readonly object _value;
        private readonly NameValueCollection _queryParameters;
        private readonly int _maxResultCount;

        /// <summary>
        /// Initializes a new instance of the <see cref="ActionContext" /> struct.
        /// </summary>
        /// <param name="name">The name.</param>
        /// <param name="value">The value.</param>
        /// <param name="queryParameters">The query parameters.</param>
        /// <param name="maxResultCount">The maximum result count.</param>
        public ActionContext(string name, object value, NameValueCollection queryParameters, int maxResultCount = 0) {
            _name = name;
            _value = value;
            _queryParameters = queryParameters;
            _maxResultCount = maxResultCount;
        }

        /// <summary>
        /// Gets the name.
        /// </summary>
        /// <value>
        /// The name.
        /// </value>
        public string Name { get { return _name; } }
        
        /// <summary>
        /// Gets the value.
        /// </summary>
        /// <value>
        /// The value.
        /// </value>
        public object Value { get { return _value; } }

        /// <summary>
        /// Gets the query parameters.
        /// </summary>
        /// <value>
        /// The query parameters.
        /// </value>
        public NameValueCollection QueryParameters { get { return _queryParameters; } }

        /// <summary>
        /// Gets the maximum result count.
        /// </summary>
        /// <value>
        /// The maximum result count.
        /// </value>
        public int MaxResultCount { get { return _maxResultCount; } }
    }
}
