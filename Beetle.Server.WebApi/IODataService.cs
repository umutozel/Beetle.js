using System.Linq;

namespace Beetle.Server.WebApi {

    /// <summary>
    /// Interface to be able to intercept before OData applies query.
    /// </summary>
    internal interface IODataService {

        /// <summary>
        /// Occurs when [before handle query].
        /// </summary>
        event BeforeQueryExecuteDelegate BeforeODataHandleQuery;

        /// <summary>
        /// Called when [before handle query].
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        /// <returns></returns>
        BeforeQueryExecuteEventArgs OnBeforeODataHandleQuery(ActionContext actionContext, IQueryable query);
    }
}
