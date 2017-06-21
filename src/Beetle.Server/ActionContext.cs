using System.Collections.Generic;

namespace Beetle.Server {

    public struct ActionContext {

        public ActionContext(string name, object value, string queryString, 
                             IDictionary<string, string> queryParameters,
                             int? maxResultCount = null, bool? checkRequestHash = null) {
            Name = name;
            Value = value;
            QueryString = queryString;
            QueryParameters = queryParameters;
            MaxResultCount = maxResultCount;
            CheckRequestHash = checkRequestHash;
        }

        public string Name { get; }

        public object Value { get; }

        public string QueryString { get; }

        public IDictionary<string, string> QueryParameters { get; }

        public int? MaxResultCount { get; }

        public bool? CheckRequestHash { get; }
    }
}
