using System;
using System.Linq;
using System.Web.Http.OData.Query;

namespace Beetle.Server.WebApi {

    /// <summary>
    /// Interface to be able to intercept before OData applies query.
    /// </summary>
    internal interface IODataService {

        /// <summary>
        /// Occurs when [before handle query].
        /// </summary>
        event BeforeODataQueryHandleDelegate BeforeODataQueryHandle;

        /// <summary>
        /// Called when [before handle query].
        /// </summary>
        /// <param name="args">The <see cref="BeforeQueryExecuteEventArgs"/> instance containing the event data.</param>
        void OnBeforeODataQueryHandle(BeforeODataQueryHandleEventArgs args);
    }

    /// <summary>
    /// Holds OData query handle event args.
    /// </summary>
    public class BeforeODataQueryHandleEventArgs : EventArgs {
        private readonly ActionContext _actionContext;
        private readonly ODataQueryOptions _queryOptions;

        /// <summary>
        /// Initializes a new instance of the <see cref="BeforeODataQueryHandleEventArgs" /> class.
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        /// <param name="queryOptions">The query options.</param>
        public BeforeODataQueryHandleEventArgs(ActionContext actionContext, IQueryable query, ODataQueryOptions queryOptions) {
            _actionContext = actionContext;
            Query = query;
            _queryOptions = queryOptions;
        }

        /// <summary>
        /// Gets the action.
        /// </summary>
        /// <value>
        /// The action.
        /// </value>
        public ActionContext ActionContext {
            get { return _actionContext; }
        }

        /// <summary>
        /// Gets or sets the query.
        /// </summary>
        /// <value>
        /// The query.
        /// </value>
        public IQueryable Query { get; set; }

        /// <summary>
        /// Gets the query options.
        /// </summary>
        /// <value>
        /// The query options.
        /// </value>
        public ODataQueryOptions QueryOptions {
            get { return _queryOptions; }
        }
    }

    /// <summary>
    /// Fired before OData handles query.
    /// </summary>
    /// <param name="sender">The sender.</param>
    /// <param name="args">The <see cref="BeforeODataQueryHandleEventArgs"/> instance containing the event data.</param>
    public delegate void BeforeODataQueryHandleDelegate(object sender, BeforeODataQueryHandleEventArgs args);
}
