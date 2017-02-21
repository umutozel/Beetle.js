using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Mvc;
using System.Web.Routing;

namespace Beetle.Server.Mvc {

    [BeetleActionFilter]
    public class BeetleController<TContextHandler> : Controller, IBeetleService<TContextHandler>
            where TContextHandler : class, IContextHandler {
        private readonly IBeetleConfig _beetleConfig;

        public BeetleController()
            : this(null, null) {
        }

        public BeetleController(TContextHandler contextHandler)
            : this(contextHandler, null) {
        }

        public BeetleController(IBeetleConfig beetleConfig)
            : this(null, beetleConfig) {
        }

        public BeetleController(TContextHandler contextHandler, IBeetleConfig beetleConfig) {
            ContextHandler = contextHandler;
            _beetleConfig = beetleConfig;
            AutoHandleUnknownActions = false;
        }

        protected override void Initialize(RequestContext requestContext) {
            base.Initialize(requestContext);

            if (ContextHandler == null)
                ContextHandler = CreateContextHandler();
            ContextHandler.Initialize();
        }

        [NonAction]
        public virtual TContextHandler CreateContextHandler() {
            return Activator.CreateInstance<TContextHandler>();
        }

        /// <summary>
        /// Called when a request matches this controller, but no method with the specified action name is found in the controller.
        /// </summary>
        protected override void HandleUnknownAction(string action) {
            if (AutoHandleUnknownActions) {
                string queryString;
                NameValueCollection queryParams;
                Helper.GetParameters(out queryString, out queryParams, BeetleConfig);
                var result = ContextHandler.HandleUnknownAction(action);
                var actionContext = new ActionContext(action, result, queryString, queryParams, MaxResultCount, CheckRequestHash);
                var processResult = ProcessRequest(result, actionContext);
                var response = Helper.HandleResponse(processResult, BeetleConfig);
                response.ExecuteResult(ControllerContext);
            }
            else
                base.HandleUnknownAction(action);
        }

        public virtual IEnumerable<EntityBag> ResolveEntities(object saveBundle, out IEnumerable<EntityBag> unknownEntities) {
            return Beetle.Server.Helper.ResolveEntities(saveBundle, BeetleConfig, ContextHandler.Metadata(), out unknownEntities);
        }

        public virtual async Task<BeetleContentResult<SaveResult>> SaveChanges(object saveBundle) {
            var svc = (IBeetleService) this;
            var result = await svc.SaveChanges(saveBundle);
            return new BeetleContentResult<SaveResult>(result);
        }

        public TContextHandler ContextHandler { get; private set; }

        protected bool AutoHandleUnknownActions { get; set; }

        #region Implementation of IBeetleService

        public virtual object Metadata() {
            return ContextHandler.Metadata().ToMinified();
        }

        public virtual object CreateType(string typeName, string initialValues) {
            var retVal = ContextHandler.CreateType(typeName);
            Beetle.Server.Helper.CopyValuesFromJson(initialValues, retVal, BeetleConfig);
            return retVal;
        }

        public virtual ProcessResult ProcessRequest(object contentValue, ActionContext actionContext, IBeetleConfig actionConfig = null) {
            return Helper.ProcessRequest(contentValue, actionContext, actionConfig ?? BeetleConfig, this);
        }

        public virtual IEnumerable<EntityBag> HandleUnknowns(IEnumerable<EntityBag> unknowns) {
            return Enumerable.Empty<EntityBag>();
        }

        async Task<SaveResult> IBeetleService.SaveChanges(object saveBundle) {
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
    }
}