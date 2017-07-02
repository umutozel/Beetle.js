using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Controllers;

namespace Beetle.WebApi {
    using Meta;
    using Server;
    using Server.Interface;
    using ServerHelper = Server.Helper;

    public abstract class BeetleApiController<TContextHandler> : BeetleApiController, IBeetleService<TContextHandler>
        where TContextHandler : class, IContextHandler {

        protected BeetleApiController() {
        }

        protected BeetleApiController(TContextHandler contextHandler)
            : this(contextHandler, null) {
        }

        protected BeetleApiController(IBeetleConfig config)
            : this(null, config) {
        }

        protected BeetleApiController(TContextHandler contextHandler, IBeetleConfig config) : base(config) {
            ContextHandler = contextHandler;
        }

        public TContextHandler ContextHandler { get; private set; }

        IContextHandler IBeetleService.ContextHandler => ContextHandler;

        protected override void Initialize(HttpControllerContext controllerContext) {
            base.Initialize(controllerContext);

            if (ContextHandler == null) {
                ContextHandler = CreateContextHandler();
            }
            ContextHandler.Initialize();
        }

        protected virtual TContextHandler CreateContextHandler() {
            return Activator.CreateInstance<TContextHandler>();
        }

        protected override Metadata GetMetadata() {
            return ContextHandler.Metadata();
        }

        protected override Task<SaveResult> SaveChanges(SaveContext saveContext) {
            return ContextHandler.SaveChanges(saveContext);
        }
    }

    [BeetleApiController]
    public abstract class BeetleApiController : ApiController, IBeetleService, IODataService {

        protected BeetleApiController(): this(null) {
        }

        protected BeetleApiController(IBeetleConfig config) {
            Config = config;
        }

        protected bool ForbidBeetleQueryString { get; set; }

        protected bool AutoHandleUnknownActions { get; set; }

        protected abstract Metadata GetMetadata();

        [HttpGet]
        [BeetleActionFilter(typeof(SimpleResultConfig))]
        public virtual object Metadata() {
            return GetMetadata().ToMinified();
        }

        public override Task<HttpResponseMessage> ExecuteAsync(HttpControllerContext controllerContext, CancellationToken cancellationToken) {
            try {
                return base.ExecuteAsync(controllerContext, cancellationToken);
            }
            catch (HttpResponseException ex) {
                if (ex.Response.StatusCode != HttpStatusCode.NotFound || !AutoHandleUnknownActions) throw;

                var action = controllerContext.Request.GetRouteData().Values["action"].ToString();
                var content = HandleUnknownAction(action);
                // execute response
                var responseMessage = new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = content };
                return Task.FromResult(responseMessage);
            }
        }

        protected virtual ObjectContent HandleUnknownAction(string action) {
            var svc = (IBeetleService) this;
            var contextHandler = svc.ContextHandler;
            if (contextHandler == null)
                throw new NotSupportedException();

            var result = contextHandler.HandleUnknownAction(action);
            Helper.GetParameters(Config, out string queryString, out IList<BeetleParameter> parameters);

            var actionContext = new ActionContext(action, result, queryString, parameters, MaxResultCount, CheckRequestHash, null, this);
            var processResult = ProcessRequest(actionContext);
            return Helper.HandleResponse(processResult);
        }

        protected virtual IEnumerable<EntityBag> ResolveEntities(object saveBundle, out IEnumerable<EntityBag> unknownEntities) {
            return ServerHelper.ResolveEntities(saveBundle, Config, GetMetadata(), out unknownEntities);
        }

        protected virtual IEnumerable<EntityBag> HandleUnknowns(IEnumerable<EntityBag> unknowns) {
            return Enumerable.Empty<EntityBag>();
        }

        protected abstract Task<SaveResult> SaveChanges(SaveContext saveContext);

        #region Implementation of IBeetleService

        public virtual IBeetleConfig Config { get; }

        IContextHandler IBeetleService.ContextHandler => null;

        public int? MaxResultCount { get; set; }

        public bool CheckRequestHash { get; set; }

        Metadata IBeetleService.Metadata() {
            return GetMetadata();
        }

        public virtual object CreateType(string typeName, string initialValues) {
            return ServerHelper.CreateType(typeName, initialValues, Config);
        }

        ProcessResult IBeetleService.ProcessRequest(ActionContext actionContext) {
            return ProcessRequest(actionContext);
        }

        protected virtual ProcessResult ProcessRequest(ActionContext actionContext) {
            var svc = (IBeetleService) this;
            return svc.ContextHandler != null
                ? svc.ContextHandler.ProcessRequest(actionContext)
                : ServerHelper.DefaultRequestProcessor(actionContext);
        }

        [HttpPost]
        public async Task<SaveResult> SaveChanges(object saveBundle) {
            var entityBags = ResolveEntities(saveBundle, out IEnumerable<EntityBag> unknowns);
            var entityBagList = entityBags == null
                ? new List<EntityBag>()
                : entityBags as List<EntityBag> ?? entityBags.ToList();

            var handledUnknowns = HandleUnknowns(unknowns);
            if (handledUnknowns != null) entityBagList.AddRange(handledUnknowns);
            if (!entityBagList.Any()) return SaveResult.Empty;

            var saveContext = new SaveContext(entityBagList);
            OnBeforeSaveChanges(new BeforeSaveEventArgs(saveContext));
            var retVal = await SaveChanges(saveContext);
            OnAfterSaveChanges(new AfterSaveEventArgs(retVal));

            return retVal;
        }

        #region Event-Handlers

        public event BeforeQueryExecuteDelegate BeforeHandleQuery;

        void IBeetleService.OnBeforeHandleQuery(BeforeQueryExecuteEventArgs args) {
            OnBeforeHandleQuery(args);
        }

        protected virtual void OnBeforeHandleQuery(BeforeQueryExecuteEventArgs args) {
            BeforeHandleQuery?.Invoke(this, args);
        }

        public event BeforeQueryExecuteDelegate BeforeQueryExecute;

        void IBeetleService.OnBeforeQueryExecute(BeforeQueryExecuteEventArgs args) {
            OnBeforeQueryExecute(args);
        }

        protected virtual void OnBeforeQueryExecute(BeforeQueryExecuteEventArgs args) {
            BeforeQueryExecute?.Invoke(this, args);
        }

        public event AfterQueryExecuteDelegate AfterQueryExecute;

        void IBeetleService.OnAfterQueryExecute(AfterQueryExecuteEventArgs args) {
            OnAfterQueryExecute(args);
        }

        protected virtual void OnAfterQueryExecute(AfterQueryExecuteEventArgs args) {
            AfterQueryExecute?.Invoke(this, args);
        }

        public event BeforeSaveDelegate BeforeSaveChanges;

        protected virtual void OnBeforeSaveChanges(BeforeSaveEventArgs args) {
            BeforeSaveChanges?.Invoke(this, args);
        }

        public event AfterSaveDelegate AfterSaveChanges;

        protected virtual void OnAfterSaveChanges(AfterSaveEventArgs args) {
            AfterSaveChanges?.Invoke(this, args);
        }

        #endregion

        #endregion

        #region Implementation of IODataService

        public event BeforeODataQueryHandleDelegate BeforeODataQueryHandle;

        void IODataService.OnBeforeODataQueryHandle(BeforeODataQueryHandleEventArgs args) {
            BeforeODataQueryHandle?.Invoke(this, args);
        }

        protected void OnBeforeODataHandleQuery(BeforeODataQueryHandleEventArgs args) {
            ((IODataService)this).OnBeforeODataQueryHandle(args);
        }

        #endregion
    }
}