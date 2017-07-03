using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Mvc;
using System.Web.Routing;

namespace Beetle.Mvc {
    using Meta;
    using Server;
    using Server.Interface;
    using ServerHelper = Server.Helper;

    public abstract class BeetleController<TContextHandler> : BeetleController, IBeetleService<TContextHandler>
            where TContextHandler : class, IContextHandler {

        protected BeetleController() {
        }

        protected BeetleController(TContextHandler contextHandler)
            : this(contextHandler, null) {
        }

        protected BeetleController(IBeetleConfig config)
            : this(null, config) {
        }

        protected BeetleController(TContextHandler contextHandler, IBeetleConfig config): base(config) {
            ContextHandler = contextHandler;
        }

        public TContextHandler ContextHandler { get; private set; }

        IContextHandler IBeetleService.ContextHandler => ContextHandler;

        protected override void Initialize(RequestContext requestContext) {
            base.Initialize(requestContext);

            if (ContextHandler == null) {
                ContextHandler = CreateContextHandler();
            }
            ContextHandler.Initialize();
        }

        protected virtual TContextHandler CreateContextHandler() {
            return Activator.CreateInstance<TContextHandler>();
        }
    }

    [BeetleActionFilter]
    public abstract class BeetleController: Controller, IBeetleService {

        protected BeetleController(): this(null) {
        }

        protected BeetleController(IBeetleConfig config) {
            Config = config;
        }

        protected bool AutoHandleUnknownActions { get; set; }

        protected virtual Metadata GetMetadata() {
            var svc = (IBeetleService)this;
            return svc.ContextHandler?.Metadata();
        }

        [BeetleActionFilter(typeof(SimpleResultConfig))]
        public virtual object Metadata() {
            return GetMetadata()?.ToMinified();
        }

        protected override void HandleUnknownAction(string action) {
            if (AutoHandleUnknownActions) {
                var contextHandler = ((IBeetleService)this).ContextHandler;
                if (contextHandler == null)
                    throw new NotSupportedException();

                var result = contextHandler.HandleUnknownAction(action);
                Helper.GetParameters(Config, out string queryString, out IList<BeetleParameter> parameters);

                var actionContext = new ActionContext(
                    action, result, queryString, parameters,
                    MaxResultCount, CheckRequestHash, null, this
                );
                var processResult = ProcessRequest(actionContext);
                var response = Helper.HandleResponse(processResult);
                response.ExecuteResult(ControllerContext);
            }
            else {
                base.HandleUnknownAction(action);
            }
        }

        protected virtual IList<EntityBag> ResolveEntities(object saveBundle, 
                                                                 out IList<EntityBag> unknownEntities) {
            return ServerHelper.ResolveEntities(saveBundle, Config, GetMetadata(), out unknownEntities);
        }

        protected virtual IEnumerable<EntityBag> HandleUnknowns(IEnumerable<EntityBag> unknowns) {
            return Enumerable.Empty<EntityBag>();
        }

        public async Task<BeetleContentResult<SaveResult>> SaveChanges(object saveBundle) {
            var svc = (IBeetleService) this;
            var result = await svc.SaveChanges(saveBundle);
            return new BeetleContentResult<SaveResult>(result);
        }

        protected virtual Task<SaveResult> SaveChanges(SaveContext saveContext) {
            var svc = (IBeetleService) this;
            return svc.ContextHandler?.SaveChanges(saveContext)
                   ?? throw new NotSupportedException();
        }

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
            var svc = (IBeetleService)this;
            return svc.ContextHandler != null
                ? svc.ContextHandler.ProcessRequest(actionContext)
                : ServerHelper.DefaultRequestProcessor(actionContext);
        }

        async Task<SaveResult> IBeetleService.SaveChanges(object saveBundle) {
            var entityBags = ResolveEntities(saveBundle, out IList<EntityBag> unknowns);
            var entityBagList = entityBags == null
                ? new List<EntityBag>()
                : entityBags as List<EntityBag> ?? entityBags.ToList();

            var handledUnknowns = HandleUnknowns(unknowns);
            if (handledUnknowns != null) {
                entityBagList.AddRange(handledUnknowns);
            }
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
    }
}