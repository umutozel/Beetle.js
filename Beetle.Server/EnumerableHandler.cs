using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Beetle.Server.Properties;

namespace Beetle.Server {

    public class EnumerableHandler : IContentHandler<IEnumerable> {
        private static readonly Lazy<EnumerableHandler> _instance = new Lazy<EnumerableHandler>();

        public ProcessResult HandleContent(IEnumerable contentValue, IEnumerable<KeyValuePair<string, string>> parameters,
                                           ActionContext actionContext, IBeetleService service = null, IContextHandler contextHandler = null) {
            var maxResultCount = actionContext.MaxResultCount;
            if (maxResultCount <= 0 && service != null && service.MaxResultCount > 0)
                maxResultCount = service.MaxResultCount;

            if (maxResultCount > 0) {
                var count = Enumerable.Count((dynamic)contentValue);
                if (count > maxResultCount)
                    throw new BeetleException(Resources.ResultCountExceeded);
            }

            return new ProcessResult(actionContext) { Result = contentValue };
        }

        public static IContentHandler<IEnumerable> Instance {
            get { return _instance.Value; }
        }
    }
}
