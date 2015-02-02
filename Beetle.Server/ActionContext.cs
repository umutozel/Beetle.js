using System.Collections.Specialized;

namespace Beetle.Server {

    /// <summary>
    /// Holds Action data.
    /// </summary>
    public struct ActionContext {
        private readonly string _name;
        private readonly object _value;
        private readonly string _queryString;
        private readonly NameValueCollection _queryParameters;
        private readonly int _maxResultCount;
        private readonly bool? _checkRequestHash;

        /// <summary>
        /// Initializes a new instance of the <see cref="ActionContext" /> struct.
        /// </summary>
        /// <param name="name">The name.</param>
        /// <param name="value">The value.</param>
        /// <param name="queryString">The query string.</param>
        /// <param name="queryParameters">The query parameters.</param>
        /// <param name="maxResultCount">The maximum result count.</param>
        /// <param name="checkRequestHash">The check request hash.</param>
        public ActionContext(string name, object value, string queryString, NameValueCollection queryParameters, int maxResultCount, bool? checkRequestHash) {
            _name = name;
            _value = value;
            _queryString = queryString;
            _queryParameters = queryParameters;
            _maxResultCount = maxResultCount;
            _checkRequestHash = checkRequestHash;
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
        /// Gets the query string.
        /// </summary>
        /// <value>
        /// The query string.
        /// </value>
        public string QueryString {
            get { return _queryString; }
        }

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
        /// Gets the check request hash.
        /// </summary>
        /// <value>
        /// The check request hash.
        /// </value>
        public bool? CheckRequestHash {
            get { return _checkRequestHash; }
        }
    }
}
