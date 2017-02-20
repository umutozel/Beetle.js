using System.Collections.Specialized;

namespace Beetle.Server {

    public struct ActionContext {
        private readonly string _name;
        private readonly object _value;
        private readonly string _queryString;
        private readonly NameValueCollection _queryParameters;
        private readonly int _maxResultCount;
        private readonly bool? _checkRequestHash;

        public ActionContext(string name, object value, string queryString, NameValueCollection queryParameters, int maxResultCount, bool? checkRequestHash) {
            _name = name;
            _value = value;
            _queryString = queryString;
            _queryParameters = queryParameters;
            _maxResultCount = maxResultCount;
            _checkRequestHash = checkRequestHash;
        }

        public string Name { get { return _name; } }
        
        public object Value { get { return _value; } }

        public string QueryString {
            get { return _queryString; }
        }

        public NameValueCollection QueryParameters { get { return _queryParameters; } }

        public int MaxResultCount { get { return _maxResultCount; } }

        public bool? CheckRequestHash {
            get { return _checkRequestHash; }
        }
    }
}
