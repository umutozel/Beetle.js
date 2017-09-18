using System.Collections.Generic;

namespace Beetle.Server {
    using Interface;

    public class ActionContext {

        public ActionContext(string name, object value,
                             IEnumerable<BeetleParameter> parameters,
                             int? maxResultCount,
                             IBeetleConfig config, IBeetleService service) {
            Name = name;
            Value = value;
            Parameters = parameters;
            MaxResultCount = maxResultCount;
            Config = config;
            Service = service;
        }

        public string Name { get; }

        public object Value { get; }

        public IEnumerable<BeetleParameter> Parameters { get; }

        public int? MaxResultCount { get; }

        public IBeetleConfig Config { get; }

        public IBeetleService Service { get; }
    }
}
