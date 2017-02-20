using System;
using System.Linq;
using System.Web.Http.OData.Query;

namespace Beetle.Server.WebApi {

    /// <summary>
    /// Interface to be able to intercept before OData applies query.
    /// </summary>
    internal interface IODataService {

        event BeforeODataQueryHandleDelegate BeforeODataQueryHandle;

        void OnBeforeODataQueryHandle(BeforeODataQueryHandleEventArgs args);
    }

    public class BeforeODataQueryHandleEventArgs : EventArgs {
        private readonly ActionContext _actionContext;
        private readonly ODataQueryOptions _queryOptions;

        public BeforeODataQueryHandleEventArgs(ActionContext actionContext, IQueryable query, ODataQueryOptions queryOptions) {
            _actionContext = actionContext;
            Query = query;
            _queryOptions = queryOptions;
        }

        public ActionContext ActionContext {
            get { return _actionContext; }
        }

        public IQueryable Query { get; set; }

        public ODataQueryOptions QueryOptions {
            get { return _queryOptions; }
        }
    }

    public delegate void BeforeODataQueryHandleDelegate(object sender, BeforeODataQueryHandleEventArgs args);
}
