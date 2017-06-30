using System.Collections.Generic;

namespace Beetle.Server {
    using Interface;

    public class ActionContext {

        public ActionContext(string name, object value, string queryString, 
                             IEnumerable<BeetleParameter> parameters,
                             int? maxResultCount, bool? checkRequestHash,
                             IBeetleConfig config, IBeetleService service) {
            Name = name;
            Value = value;
            QueryString = queryString;
            Parameters = parameters;
            MaxResultCount = maxResultCount;
            CheckRequestHash = checkRequestHash;
            Config = config;
            Service = service;
        }

        public string Name { get; }

        public object Value { get; }

        public string QueryString { get; }

        public int? MaxResultCount { get; }

        public bool? CheckRequestHash { get; }

        public IEnumerable<BeetleParameter> Parameters { get; }

        public IBeetleConfig Config { get; }

        public IBeetleService Service { get; }
    }
}
