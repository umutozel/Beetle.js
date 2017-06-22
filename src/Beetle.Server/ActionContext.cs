using System.Collections.Generic;

namespace Beetle.Server {

    public class ActionContext {

        public ActionContext(string name, object value, string queryString,
                             IEnumerable<BeetleParameter>  parameters,
                             int? maxResultCount = null, bool? checkRequestHash = null) {
            Name = name;
            Value = value;
            QueryString = queryString;
            QueryParameters = parameters;
            MaxResultCount = maxResultCount;
            CheckRequestHash = checkRequestHash;
        }

        public string Name { get; }

        public object Value { get; }

        public string QueryString { get; }

        public IEnumerable<BeetleParameter> QueryParameters { get; }

        public int? MaxResultCount { get; }

        public bool? CheckRequestHash { get; }
    }
}
