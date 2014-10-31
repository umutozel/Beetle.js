using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Beetle.Server.Properties;

namespace Beetle.Server {

    /// <summary>
    /// Enumerable content handler.
    /// 
    /// Default implementation only checks for MaxResultCount.
    /// </summary>
    public class EnumerableHandler : IContentHandler<IEnumerable> {
        private static readonly Lazy<EnumerableHandler> _instance = new Lazy<EnumerableHandler>();

        /// <summary>
        /// Handles the content.
        /// </summary>
        /// <param name="contentValue">The content value.</param>
        /// <param name="parameters">The parameters.</param>
        /// <param name="actionContext">The action context.</param>
        /// <param name="service">The service.</param>
        /// <param name="contextHandler">The context handler.</param>
        /// <returns></returns>
        /// <exception cref="Beetle.Server.BeetleException"></exception>
        public ProcessResult HandleContent(IEnumerable contentValue, IEnumerable<KeyValuePair<string, string>> parameters,
                                           ActionContext actionContext, IBeetleService service = null, IContextHandler contextHandler = null) {
            var maxResultCount = actionContext.MaxResultCount;
            if (service != null && service.MaxResultCount > 0 && service.MaxResultCount < maxResultCount)
                maxResultCount = service.MaxResultCount;

            if (maxResultCount > 0) {
                var count = Enumerable.Count((dynamic)contentValue);
                if (count > maxResultCount)
                    throw new BeetleException(Resources.ResultCountExceeded);
            }

            return new ProcessResult(actionContext) { Result = contentValue };
        }

        /// <summary>
        /// Gets the instance.
        /// </summary>
        /// <value>
        /// The instance.
        /// </value>
        public static EnumerableHandler Instance {
            get { return _instance.Value; }
        }
    }
}
