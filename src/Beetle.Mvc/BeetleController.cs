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

        protected bool AutoHandleUnknownActions { get; set; }

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

        public override Metadata Metadata() {
            return ContextHandler.Metadata();
        }

        /// <summary>
        /// Called when a request matches this controller, but no method with the specified action name is found in the controller.
        /// </summary>
        protected override void HandleUnknownAction(string action) {
            if (AutoHandleUnknownActions) {
                Helper.GetParameters(Config, out string queryString, out IDictionary<string, string> queryParams);
                var result = ContextHandler.HandleUnknownAction(action);
                var beetleParameters = ServerHelper.GetBeetleParameters(queryParams);
                var actionContext = new ActionContext(action, result, queryString, beetleParameters, 
                                                      MaxResultCount, CheckRequestHash, Config, this);
                var processResult = ProcessRequest(actionContext);
                var response = Helper.HandleResponse(processResult);
                response.ExecuteResult(ControllerContext);
            }
            else {
                base.HandleUnknownAction(action);
            }
        }

        async Task<SaveResult> IBeetleService.SaveChanges(object saveBundle) {
            var entityBags = ResolveEntities(saveBundle, out IEnumerable<EntityBag> unknowns);
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
    }

    [BeetleActionFilter]
    public abstract class BeetleController: Controller, IBeetleService {

        protected BeetleController(): this(null) {
        }

        protected BeetleController(IBeetleConfig config) {
            Config = config;
        }

        public virtual IEnumerable<EntityBag> ResolveEntities(object saveBundle, 
                                                              out IEnumerable<EntityBag> unknownEntities) {
            return ServerHelper.ResolveEntities(saveBundle, Config, Metadata(), out unknownEntities);
        }

        public async Task<BeetleContentResult<SaveResult>> SaveChanges(object saveBundle) {
            var svc = (IBeetleService) this;
            var result = await svc.SaveChanges(saveBundle);
            return new BeetleContentResult<SaveResult>(result);
        }

        #region Implementation of IBeetleService

        public virtual IBeetleConfig Config { get; }

        IContextHandler IBeetleService.ContextHandler => null;

        public int? MaxResultCount { get; set; }

        public bool CheckRequestHash { get; set; }

        public abstract Metadata Metadata();

        public virtual object CreateType(string typeName, string initialValues) {
            return ServerHelper.CreateType(typeName, initialValues, Config);
        }

        public virtual ProcessResult ProcessRequest(ActionContext actionContext) {
            return Helper.ProcessRequest(actionContext);
        }

        Task<SaveResult> IBeetleService.SaveChanges(object saveBundle) {
            throw new NotImplementedException();
        }

        public virtual IEnumerable<EntityBag> HandleUnknowns(IEnumerable<EntityBag> unknowns) {
            return Enumerable.Empty<EntityBag>();
        }

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