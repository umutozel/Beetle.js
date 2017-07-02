using System;
using System.Linq;
using System.Web.Http.OData.Query;

namespace Beetle.WebApi {
    using Server;

    /// <summary>
    /// Interface to be able to intercept before OData applies query.
    /// </summary>
    internal interface IODataService {

        event BeforeODataQueryHandleDelegate BeforeODataQueryHandle;

        void OnBeforeODataQueryHandle(BeforeODataQueryHandleEventArgs args);
    }

    public class BeforeODataQueryHandleEventArgs : EventArgs {
        public BeforeODataQueryHandleEventArgs(ActionContext actionContext, IQueryable query, ODataQueryOptions queryOptions) {
            ActionContext = actionContext;
            Query = query;
            QueryOptions = queryOptions;
        }

        public ActionContext ActionContext { get; }

        public IQueryable Query { get; set; }

        public ODataQueryOptions QueryOptions { get; }
    }

    public delegate void BeforeODataQueryHandleDelegate(object sender, BeforeODataQueryHandleEventArgs args);
}
