using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Controllers;

namespace Beetle.Server.WebApi {

    [BeetleApiController]
    public class BeetleApiController<TContextHandler> : ApiController, IBeetleService<TContextHandler>, IODataService
            where TContextHandler : class, IContextHandler {
        private readonly IBeetleConfig _beetleConfig;

        public BeetleApiController(): this(null, null) {
        }

        public BeetleApiController(TContextHandler contextHandler): this(contextHandler, null) {
        }

        public BeetleApiController(IBeetleConfig beetleConfig): this(null, beetleConfig) {
        }

        public BeetleApiController(TContextHandler contextHandler, IBeetleConfig beetleConfig) {
            ContextHandler = contextHandler;
            _beetleConfig = beetleConfig;
            AutoHandleUnknownActions = false;
        }

        protected override void Initialize(HttpControllerContext controllerContext) {
            base.Initialize(controllerContext);

            if (ContextHandler == null)
                ContextHandler = CreateContextHandler();
            ContextHandler.Initialize();
        }

        public virtual TContextHandler CreateContextHandler() {
            return Activator.CreateInstance<TContextHandler>();
        }

        public override Task<HttpResponseMessage> ExecuteAsync(HttpControllerContext controllerContext, CancellationToken cancellationToken) {
            try {
                return base.ExecuteAsync(controllerContext, cancellationToken);
            }
            catch (HttpResponseException ex) {
                if (ex.Response.StatusCode == HttpStatusCode.NotFound && AutoHandleUnknownActions) {
                    var action = controllerContext.Request.GetRouteData().Values["action"].ToString();
                    var content = HandleUnknownAction(action);
                    // execute response
                    var responseMessage = new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = content };
                    return Task.FromResult(responseMessage);
                }
                throw;
            }
        }

        protected virtual ObjectContent HandleUnknownAction(string action) {
            // get value for action
            var result = ContextHandler.HandleUnknownAction(action);
            // get beetle parameters
            string queryString;
            var parameters = Helper.GetParameters(BeetleConfig, out queryString);
            var actionContext = new ActionContext(action, result, queryString, parameters, MaxResultCount, CheckRequestHash);
            var queryable = result as IQueryable;
            // if value is a query, first handle OData parameters
            if (queryable != null)
                result = BeetleQueryableAttribute.Instance.ApplyODataQuery(queryable, this, actionContext, Request);
            // and process the request
            var processResult = ProcessRequest(result, actionContext);
            // create response
            return Helper.HandleResponse(processResult, BeetleConfig);
        }

        public virtual IEnumerable<EntityBag> ResolveEntities(object saveBundle, out IEnumerable<EntityBag> unknownEntities) {
            return Server.Helper.ResolveEntities(saveBundle, BeetleConfig, ContextHandler.Metadata(), out unknownEntities);
        }

        public TContextHandler ContextHandler { get; private set; }

        public bool ForbidBeetleQueryString { get; set; }

        protected bool AutoHandleUnknownActions { get; set; }

        #region Implementation of IBeetleService

        [HttpGet]
        public virtual object Metadata() {
            return ContextHandler.Metadata().ToMinified();
        }

        [HttpGet]
        public virtual object CreateType(string typeName, string initialValues) {
            var retVal = ContextHandler.CreateType(typeName);
            Server.Helper.CopyValuesFromJson(initialValues, retVal, BeetleConfig);
            return retVal;
        }

        public virtual ProcessResult ProcessRequest(object contentValue, ActionContext actionContext, IBeetleConfig actionConfig = null) {
            return Helper.ProcessRequest(contentValue, actionContext, Request, ForbidBeetleQueryString, actionConfig ?? BeetleConfig, this);
        }

        /// <summary>
        /// Handles the unknowns objects (which does not have $type).
        /// </summary>
        public virtual IEnumerable<EntityBag> HandleUnknowns(IEnumerable<EntityBag> unknowns) {
            return Enumerable.Empty<EntityBag>();
        }

        [HttpPost]
        public virtual async Task<SaveResult> SaveChanges(object saveBundle) {
            IEnumerable<EntityBag> unknowns;
            var entityBags = ResolveEntities(saveBundle, out unknowns);
            var entityBagList = entityBags == null
                ? new List<EntityBag>()
                : entityBags as List<EntityBag> ?? entityBags.ToList();

            var handledUnknowns = HandleUnknowns(unknowns);
            if (handledUnknowns != null) entityBagList.AddRange(handledUnknowns);
            if (!entityBagList.Any()) return SaveResult.Empty;

            var saveContext = new SaveContext();
            OnBeforeSaveChanges(new BeforeSaveEventArgs(entityBagList, saveContext));
            var retVal = await ContextHandler.SaveChanges(entityBagList, saveContext);
            OnAfterSaveChanges(new AfterSaveEventArgs(entityBagList, retVal));

            return retVal;
        }

        public virtual IBeetleConfig BeetleConfig {
            get { return _beetleConfig; }
        }

        IContextHandler IBeetleService.ContextHandler { get { return ContextHandler; } }

        public int MaxResultCount { get; set; }

        public bool CheckRequestHash { get; set; }

        public event BeforeQueryExecuteDelegate BeforeHandleQuery;

        void IBeetleService.OnBeforeHandleQuery(BeforeQueryExecuteEventArgs args) {
            OnBeforeHandleQuery(args);
        }

        protected virtual void OnBeforeHandleQuery(BeforeQueryExecuteEventArgs args) {
            var handler = BeforeHandleQuery;
            if (handler != null)
                handler(this, args);
        }

        public event BeforeQueryExecuteDelegate BeforeQueryExecute;

        void IBeetleService.OnBeforeQueryExecute(BeforeQueryExecuteEventArgs args) {
            OnBeforeQueryExecute(args);
        }

        protected virtual void OnBeforeQueryExecute(BeforeQueryExecuteEventArgs args) {
            var handler = BeforeQueryExecute;
            if (handler != null)
                handler(this, args);
        }

        public event AfterQueryExecuteDelegate AfterQueryExecute;

        void IBeetleService.OnAfterQueryExecute(AfterQueryExecuteEventArgs args) {
            OnAfterQueryExecute(args);
        }

        protected virtual void OnAfterQueryExecute(AfterQueryExecuteEventArgs args) {
            var handler = AfterQueryExecute;
            if (handler != null)
                handler(this, args);
        }

        public event BeforeSaveDelegate BeforeSaveChanges;

        protected virtual void OnBeforeSaveChanges(BeforeSaveEventArgs args) {
            var handler = BeforeSaveChanges;
            if (handler != null) handler(this, args);
        }

        public event AfterSaveDelegate AfterSaveChanges;

        protected virtual void OnAfterSaveChanges(AfterSaveEventArgs args) {
            var handler = AfterSaveChanges;
            if (handler != null) handler(this, args);
        }

        #endregion

        #region Implementation of IODataService

        public event BeforeODataQueryHandleDelegate BeforeODataQueryHandle;

        void IODataService.OnBeforeODataQueryHandle(BeforeODataQueryHandleEventArgs args) {
            var handler = BeforeODataQueryHandle;
            if (handler != null)
                handler(this, args);
        }

        protected void OnBeforeODataHandleQuery(BeforeODataQueryHandleEventArgs args) {
            ((IODataService)this).OnBeforeODataQueryHandle(args);
        }

        #endregion
    }
}