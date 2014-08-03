using System.Collections.Generic;

namespace Beetle.Server {

    /// <summary>
    /// Common structure for content handlers.
    /// A content handler: processes given content value (with given query parameters) and returns a result
    /// </summary>
    public interface IContentHandler<in T> {

        /// <summary>
        /// Handles the content.
        /// </summary>
        /// <param name="contentValue">The content value.</param>
        /// <param name="parameters">The parameters.</param>
        /// <param name="actionContext">The action context.</param>
        /// <param name="service">The service.</param>
        /// <param name="contextHandler">The context handler.</param>
        /// <returns></returns>
        ProcessResult HandleContent(T contentValue, IEnumerable<KeyValuePair<string, string>> parameters, ActionContext actionContext,
                                    IBeetleService service = null, IContextHandler contextHandler = null);
    }
}
