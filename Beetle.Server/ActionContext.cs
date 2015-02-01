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
        private readonly bool? _checkQueryHash;

        /// <summary>
        /// Initializes a new instance of the <see cref="ActionContext" /> struct.
        /// </summary>
        /// <param name="name">The name.</param>
        /// <param name="value">The value.</param>
        /// <param name="queryParameters">The query parameters.</param>
        /// <param name="maxResultCount">The maximum result count.</param>
        /// <param name="checkQueryHash">if set to <c>true</c> [check query hash].</param>
        public ActionContext(string name, object value, NameValueCollection queryParameters, int maxResultCount, bool? checkQueryHash) {
            _name = name;
            _value = value;
            _queryParameters = queryParameters;
            _maxResultCount = maxResultCount;
            _checkQueryHash = checkQueryHash;
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

        /// <summary>
        /// Gets a value indicating whether [check query hash].
        /// </summary>
        /// <value>
        ///   <c>true</c> if [check query hash]; otherwise, <c>false</c>.
        /// </value>
        public bool? CheckQueryHash {
            get { return _checkQueryHash; }
        }
    }
}
