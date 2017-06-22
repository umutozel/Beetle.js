using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace Beetle.Server {
    using Interface;
    using Properties;

    public class EnumerableHandler : IContentHandler<IEnumerable> {
        private static readonly Lazy<EnumerableHandler> _instance = new Lazy<EnumerableHandler>();

        public ProcessResult HandleContent(IEnumerable contentValue, IEnumerable<BeetleParameter> parameters,
                                           ActionContext actionContext, IBeetleService service = null) {
            var maxResultCount = actionContext.MaxResultCount ?? service?.MaxResultCount;
            if (maxResultCount > 0) {
                var count = Enumerable.Count((dynamic)contentValue);
                if (count > maxResultCount)
                    throw new BeetleException(Resources.ResultCountExceeded);
            }

            return new ProcessResult(actionContext) { Result = contentValue };
        }

        public static IContentHandler<IEnumerable> Instance => _instance.Value;
    }
}
