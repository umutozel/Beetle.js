using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Web.Mvc;
using System.Web.Routing;

namespace Beetle.Server.Mvc {

    /// <summary>
    /// Service controller base class. To use as a WebApi controller, just derive from this class and add some query methods.
    /// </summary>
    /// <typeparam name="TContextHandler">The type of the context handler.</typeparam>
    [BeetleActionFilter]
    public class BeetleController<TContextHandler> : Controller, IBeetleService<TContextHandler>
            where TContextHandler : class, IContextHandler, new() {
        private readonly BeetleConfig _beetleConfig;

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleController{TContextHandler}"/> class.
        /// </summary>
        public BeetleController(): this(null, null) {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleController{TContextHandler}"/> class.
        /// </summary>
        /// <param name="contextHandler">The context handler.</param>
        public BeetleController(TContextHandler contextHandler): this(contextHandler, null) {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleController{TContextHandler}"/> class.
        /// </summary>
        /// <param name="beetleConfig">The beetle config.</param>
        public BeetleController(BeetleConfig beetleConfig): this(null, beetleConfig) {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleController{TContextHandler}"/> class.
        /// </summary>
        /// <param name="contextHandler">The context handler.</param>
        /// <param name="beetleConfig">The beetle configuration.</param>
        public BeetleController(TContextHandler contextHandler, BeetleConfig beetleConfig) {
            ContextHandler = contextHandler;
            _beetleConfig = beetleConfig ?? BeetleConfig.Instance;
            AutoHandleUnknownActions = true;
        }

        /// <summary>
        /// Initializes data that might not be available when the constructor is called.
        /// </summary>
        /// <param name="requestContext">The HTTP context and route data.</param>
        protected override void Initialize(RequestContext requestContext) {
            base.Initialize(requestContext);

            if (ContextHandler == null)
                ContextHandler = CreateContextHandler();
            ContextHandler.Initialize();
        }

        /// <summary>
        /// Gets the context handler.
        /// </summary>
        /// <returns></returns>
        [NonAction]
        public virtual TContextHandler CreateContextHandler() {
            return new TContextHandler();
        }

        /// <summary>
        /// Called when a request matches this controller, but no method with the specified action name is found in the controller.
        /// </summary>
        /// <param name="action">The name of the attempted action.</param>
        protected override void HandleUnknownAction(string action) {
            if (AutoHandleUnknownActions) {
                NameValueCollection queryParams;
                object[] actionParameters;
                Helper.GetParameters(out queryParams, out actionParameters, BeetleConfig);
                var result = ContextHandler.HandleUnknownAction(action);
                var actionContext = new ActionContext(action, result, queryParams);
                var processResult = ProcessRequest(result, actionContext);
                var response = Helper.HandleResponse(processResult, BeetleConfig);
                response.ExecuteResult(ControllerContext);
            }
            else
                base.HandleUnknownAction(action);
        }

        /// <summary>
        /// Resolves the entities.
        /// </summary>
        /// <param name="saveBundle">The save bundle.</param>
        /// <param name="unknownEntities">The unknown entities.</param>
        /// <returns></returns>
        /// <exception cref="System.InvalidOperationException">Cannot find tracker info.</exception>
        public virtual IEnumerable<EntityBag> ResolveEntities(object saveBundle, out IEnumerable<EntityBag> unknownEntities) {
            return Beetle.Server.Helper.ResolveEntities(saveBundle, BeetleConfig, out unknownEntities);
        }

        /// <summary>
        /// Gets the context handler.
        /// </summary>
        /// <value>
        /// The context handler.
        /// </value>
        public TContextHandler ContextHandler { get; private set; }

        /// <summary>
        /// Gets or sets a value indicating whether [automatic handle unknown actions].
        /// </summary>
        /// <value>
        /// <c>true</c> if [automatic handle unknown actions]; otherwise, <c>false</c>.
        /// </value>
        protected bool AutoHandleUnknownActions { get; set; }

        #region Implementation of IBeetleService

        /// <summary>
        /// Gets metadata from context handler.
        /// </summary>
        /// <returns>Metadata object.</returns>
        [BeetleActionFilter(typeof(SimpleResultConfig))]
        public virtual object Metadata() {
            return ContextHandler.Metadata().ToMinified();
        }

        /// <summary>
        /// Creates the type using context handler.
        /// </summary>
        /// <param name="typeName">Name of the type.</param>
        /// <param name="initialValues">The initial values (serialized).</param>
        /// <returns>
        /// Created type.
        /// </returns>
        public virtual object CreateType(string typeName, string initialValues) {
            var retVal = ContextHandler.CreateType(typeName);
            Beetle.Server.Helper.CopyValuesFromJson(initialValues, retVal, BeetleConfig);
            return retVal;
        }

        /// <summary>
        /// Processes the request.
        /// </summary>
        /// <param name="contentValue">The content value.</param>
        /// <param name="actionContext">The action context.</param>
        /// <returns></returns>
        public virtual ProcessResult ProcessRequest(object contentValue, ActionContext actionContext) {
            return Helper.ProcessRequest(contentValue, actionContext, this);
        }

        /// <summary>
        /// Handles the unknowns objects (which does not have $type).
        /// </summary>
        /// <param name="unknowns">The unknown objects.</param>
        /// <returns></returns>
        public virtual IEnumerable<EntityBag> HandleUnknowns(IEnumerable<EntityBag> unknowns) {
            return Enumerable.Empty<EntityBag>();
        }

        /// <summary>
        /// Saves the changes using context handler.
        /// </summary>
        /// <param name="saveBundle">The save bundle.</param>
        /// <returns></returns>
        /// <exception cref="System.InvalidOperationException">Cannot find tracker info.</exception>
        [BeetleActionFilter(typeof(SimpleResultConfig))]
        public virtual SaveResult SaveChanges(object saveBundle) {
            IEnumerable<EntityBag> unknowns;
            var entityBags = ResolveEntities(saveBundle, out unknowns);
            var entityBagList = entityBags == null
                ? new List<EntityBag>()
                : entityBags as List<EntityBag> ?? entityBags.ToList();

            var handledUnknowns = HandleUnknowns(unknowns);
            if (handledUnknowns != null) entityBagList.AddRange(handledUnknowns);
            if (!entityBagList.Any()) return SaveResult.Empty;

            OnBeforeSaveChanges(entityBagList);
            var retVal = ContextHandler.SaveChanges(entityBagList);
            OnAfterSaveChanges(entityBagList);

            return retVal;
        }

        /// <summary>
        /// Gets the beetle config.
        /// </summary>
        /// <value>
        /// The beetle config.
        /// </value>
        public virtual BeetleConfig BeetleConfig {
            get { return _beetleConfig; }
        }

        /// <summary>
        /// Gets the context handler.
        /// </summary>
        /// <returns></returns>
        IContextHandler IBeetleService.ContextHandler { get { return ContextHandler; } }

        /// <summary>
        /// Gets or sets the maximum result count.
        /// </summary>
        /// <value>
        /// The maximum result count.
        /// </value>
        public int MaxResultCount { get; set; }

        /// <summary>
        /// Occurs when [before handle query].
        /// </summary>
        public event BeforeQueryExecuteDelegate BeforeHandleQuery;

        /// <summary>
        /// Called when [before handle query].
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        /// <returns></returns>
        BeforeQueryExecuteEventArgs IBeetleService.OnBeforeHandleQuery(ActionContext actionContext, IQueryable query) {
            return OnBeforeHandleQuery(actionContext, query);
        }

        /// <summary>
        /// Called when [before handle query].
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        /// <returns></returns>
        protected virtual BeforeQueryExecuteEventArgs OnBeforeHandleQuery(ActionContext actionContext, IQueryable query) {
            var args = new BeforeQueryExecuteEventArgs(actionContext, query);
            var handler = BeforeHandleQuery;
            if (handler != null)
                handler(this, args);
            return args;
        }

        /// <summary>
        /// Occurs when [before execute query].
        /// </summary>
        public event BeforeQueryExecuteDelegate BeforeQueryExecute;

        /// <summary>
        /// Called when [before query execute].
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        /// <returns></returns>
        BeforeQueryExecuteEventArgs IBeetleService.OnBeforeQueryExecute(ActionContext actionContext, IQueryable query) {
            return OnBeforeQueryExecute(actionContext, query);
        }

        /// <summary>
        /// Called when [before query execute].
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        /// <returns></returns>
        protected virtual BeforeQueryExecuteEventArgs OnBeforeQueryExecute(ActionContext actionContext, IQueryable query) {
            var args = new BeforeQueryExecuteEventArgs(actionContext, query);
            var handler = BeforeQueryExecute;
            if (handler != null)
                handler(this, args);
            return args;
        }

        /// <summary>
        /// Occurs when [after execute query].
        /// </summary>
        public event AfterQueryExecuteDelegate AfterQueryExecute;

        /// <summary>
        /// Called when [after query execute].
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        /// <param name="result">The result.</param>
        /// <returns></returns>
        AfterQueryExecuteEventArgs IBeetleService.OnAfterQueryExecute(ActionContext actionContext, IQueryable query, object result) {
            return OnAfterQueryExecute(actionContext, query, result);
        }

        /// <summary>
        /// Called when [after query execute].
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        /// <param name="result">The result.</param>
        /// <returns></returns>
        protected virtual AfterQueryExecuteEventArgs OnAfterQueryExecute(ActionContext actionContext, IQueryable query, object result) {
            var args = new AfterQueryExecuteEventArgs(actionContext, query, result);
            var handler = AfterQueryExecute;
            if (handler != null)
                handler(this, args);
            return args;
        }

        /// <summary>
        /// Occurs before save.
        /// </summary>
        public event ServiceSaveDelegate BeforeSaveChanges;

        /// <summary>
        /// Called when [before save changes].
        /// </summary>
        /// <param name="entities">The entities.</param>
        protected virtual void OnBeforeSaveChanges(IEnumerable<EntityBag> entities) {
            var handler = BeforeSaveChanges;
            if (handler != null) handler(this, new ServiceSaveEventArgs(entities));
        }

        /// <summary>
        /// Occurs after save.
        /// </summary>
        public event ServiceSaveDelegate AfterSaveChanges;

        /// <summary>
        /// Called when [after save changes].
        /// </summary>
        /// <param name="entities">The entities.</param>
        protected virtual void OnAfterSaveChanges(IEnumerable<EntityBag> entities) {
            var handler = AfterSaveChanges;
            if (handler != null) handler(this, new ServiceSaveEventArgs(entities));
        }

        #endregion
    }
}