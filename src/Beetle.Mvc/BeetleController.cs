using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Mvc;
using System.Web.Routing;

namespace Beetle.Mvc {
    using Server;
    using Server.Interface;

    [BeetleActionFilter]
    public class BeetleController<TContextHandler> : Controller, IBeetleService<TContextHandler>
            where TContextHandler : class, IContextHandler {
        public BeetleController()
            : this(null, null) {
        }

        public BeetleController(TContextHandler contextHandler)
            : this(contextHandler, null) {
        }

        public BeetleController(IBeetleConfig config)
            : this(null, config) {
        }

        public BeetleController(TContextHandler contextHandler, IBeetleConfig config) {
            ContextHandler = contextHandler;
            Config = config;
            AutoHandleUnknownActions = false;
        }

        protected override void Initialize(RequestContext requestContext) {
            base.Initialize(requestContext);

            if (ContextHandler == null) {
                ContextHandler = CreateContextHandler();
            }
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
                IDictionary<string, string> queryParams;
                Helper.GetParameters(out string queryString, out queryParams, Config);
                var result = ContextHandler.HandleUnknownAction(action);
                var beetleParameters = Beetle.Server.Helper.GetBeetleParameters(queryParams);
                var actionContext = new ActionContext(action, result, queryString, beetleParameters, MaxResultCount,
                    CheckRequestHash);
                var processResult = ProcessRequest(actionContext);
                var response = Helper.HandleResponse(processResult, Config);
                response.ExecuteResult(ControllerContext);
            }
            else {
                base.HandleUnknownAction(action);
            }
        }

        public virtual IEnumerable<EntityBag> ResolveEntities(object saveBundle, out IEnumerable<EntityBag> unknownEntities) {
            return Beetle.Server.Helper.ResolveEntities(saveBundle, Config, ContextHandler.Metadata(), out unknownEntities);
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
            Beetle.Server.Helper.CopyValuesFromJson(initialValues, retVal, Config);
            return retVal;
        }

        public virtual ProcessResult ProcessRequest(ActionContext actionContext) {
            return Helper.ProcessRequest(actionContext);
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

            var saveContext = new SaveContext(entityBagList);
            OnBeforeSaveChanges(new BeforeSaveEventArgs(saveContext));
            var retVal = await ContextHandler.SaveChanges(saveContext);
            OnAfterSaveChanges(new AfterSaveEventArgs(retVal));

            return retVal;
        }

        public virtual IBeetleConfig Config { get; }

        IContextHandler IBeetleService.ContextHandler => ContextHandler;

        public int? MaxResultCount { get; set; }

        public bool CheckRequestHash { get; set; }

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
    }
}