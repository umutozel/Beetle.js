using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Controllers;

namespace Beetle.Server.WebApi {

    /// <summary>
    /// Service controller base class. To use as a WebApi controller, just derive from this class and add some query methods.
    /// </summary>
    /// <typeparam name="TContextHandler">The type of the context handler.</typeparam>
    [BeetleApiController]
    public class BeetleApiController<TContextHandler> : ApiController, IBeetleService<TContextHandler>, IODataService
            where TContextHandler : class, IContextHandler, new() {
        private readonly BeetleConfig _beetleConfig;

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleApiController{TContextHandler}"/> class.
        /// </summary>
        public BeetleApiController(): this(null, null) {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleApiController{TContextHandler}"/> class.
        /// </summary>
        /// <param name="contextHandler">The context handler.</param>
        public BeetleApiController(TContextHandler contextHandler): this(contextHandler, null) {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleApiController{TContextHandler}"/> class.
        /// </summary>
        /// <param name="beetleConfig">The beetle config.</param>
        public BeetleApiController(BeetleConfig beetleConfig): this(null, beetleConfig) {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleApiController{TContextHandler}"/> class.
        /// </summary>
        /// <param name="contextHandler">The context handler.</param>
        /// <param name="beetleConfig">The beetle configuration.</param>
        public BeetleApiController(TContextHandler contextHandler, BeetleConfig beetleConfig) {
            ContextHandler = contextHandler;
            _beetleConfig = beetleConfig ?? BeetleConfig.Instance;
            AutoHandleUnknownActions = true;
        }

        /// <summary>
        /// Initializes the <see cref="T:System.Web.Http.ApiController" /> instance with the specified <paramref name="controllerContext" />.
        /// </summary>
        /// <param name="controllerContext">The <see cref="T:System.Web.Http.Controllers.HttpControllerContext" /> object that is used for the initialization.</param>
        protected override void Initialize(HttpControllerContext controllerContext) {
            base.Initialize(controllerContext);

            if (ContextHandler == null)
                ContextHandler = CreateContextHandler();
            ContextHandler.Initialize();
        }

        /// <summary>
        /// Gets the context handler.
        /// </summary>
        /// <returns></returns>
        public virtual TContextHandler CreateContextHandler() {
            return new TContextHandler();
        }

        /// <summary>
        /// Executes asynchronously a single HTTP operation.
        /// </summary>
        /// <param name="controllerContext">The controller context for a single HTTP operation.</param>
        /// <param name="cancellationToken">The cancellation token assigned for the HTTP operation.</param>
        /// <returns>
        /// The newly started task.
        /// </returns>
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

        /// <summary>
        /// Handles the unknown action.
        /// </summary>
        /// <param name="action">The action.</param>
        protected virtual ObjectContent HandleUnknownAction(string action) {
            // get value for action
            var result = ContextHandler.HandleUnknownAction(action);
            // get beetle parameters
            string queryString;
            var parameters = Helper.GetParameters(out queryString);
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

        /// <summary>
        /// Resolves the entities.
        /// </summary>
        /// <param name="saveBundle">The save bundle.</param>
        /// <param name="unknownEntities">The unknown entities.</param>
        /// <returns></returns>
        /// <exception cref="System.InvalidOperationException">Cannot find tracker info.</exception>
        public virtual IEnumerable<EntityBag> ResolveEntities(object saveBundle, out IEnumerable<EntityBag> unknownEntities) {
            return Server.Helper.ResolveEntities(saveBundle, BeetleConfig, out unknownEntities);
        }

        /// <summary>
        /// Gets the context handler.
        /// </summary>
        /// <value>
        /// The context handler.
        /// </value>
        public TContextHandler ContextHandler { get; private set; }

        /// <summary>
        /// Gets or sets a value indicating whether [forbid beetle query string].
        /// </summary>
        /// <value>
        /// <c>true</c> if [forbid beetle query string]; otherwise, <c>false</c>.
        /// </value>
        public bool ForbidBeetleQueryString { get; set; }

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
        [HttpGet]
        [BeetleActionFilterAttribute(typeof(SimpleResultConfig))]
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
        [HttpGet]
        public virtual object CreateType(string typeName, string initialValues) {
            var retVal = ContextHandler.CreateType(typeName);
            Server.Helper.CopyValuesFromJson(initialValues, retVal, BeetleConfig);
            return retVal;
        }

        /// <summary>
        /// Processes the request.
        /// </summary>
        /// <param name="contentValue">The content value.</param>
        /// <param name="actionContext">The action context.</param>
        /// <returns></returns>
        public virtual ProcessResult ProcessRequest(object contentValue, ActionContext actionContext) {
            return Helper.ProcessRequest(contentValue, actionContext, Request, ForbidBeetleQueryString, this);
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
        [HttpPost]
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

            var saveContext = new SaveContext();
            OnBeforeSaveChanges(new BeforeSaveEventArgs(entityBagList, saveContext));
            var retVal = ContextHandler.SaveChanges(entityBagList, saveContext);
            OnAfterSaveChanges(new AfterSaveEventArgs(entityBagList, retVal));

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
        /// Gets the maximum result count.
        /// </summary>
        /// <value>
        /// The maximum result count.
        /// </value>
        public int MaxResultCount { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether [check request hash].
        /// </summary>
        /// <value>
        ///   <c>true</c> if [check request hash]; otherwise, <c>false</c>.
        /// </value>
        public bool CheckRequestHash { get; set; }

        /// <summary>
        /// Occurs when [before handle query].
        /// </summary>
        public event BeforeQueryExecuteDelegate BeforeHandleQuery;

        /// <summary>
        /// Called when [before handle query].
        /// </summary>
        /// <param name="args">Before query execute event arguments.</param>
        void IBeetleService.OnBeforeHandleQuery(BeforeQueryExecuteEventArgs args) {
            OnBeforeHandleQuery(args);
        }

        /// <summary>
        /// Called when [before handle query].
        /// </summary>
        /// <param name="args">Before query execute event arguments.</param>
        protected virtual void OnBeforeHandleQuery(BeforeQueryExecuteEventArgs args) {
            var handler = BeforeHandleQuery;
            if (handler != null)
                handler(this, args);
        }

        /// <summary>
        /// Occurs when [before execute query].
        /// </summary>
        public event BeforeQueryExecuteDelegate BeforeQueryExecute;

        /// <summary>
        /// Called when [before query execute].
        /// </summary>
        /// <param name="args">Before query execute event arguments.</param>
        void IBeetleService.OnBeforeQueryExecute(BeforeQueryExecuteEventArgs args) {
            OnBeforeQueryExecute(args);
        }

        /// <summary>
        /// Called when [before query execute].
        /// </summary>
        /// <param name="args">Before query execute event arguments.</param>
        protected virtual void OnBeforeQueryExecute(BeforeQueryExecuteEventArgs args) {
            var handler = BeforeQueryExecute;
            if (handler != null)
                handler(this, args);
        }

        /// <summary>
        /// Occurs when [after execute query].
        /// </summary>
        public event AfterQueryExecuteDelegate AfterQueryExecute;

        /// <summary>
        /// Called when [after query execute].
        /// </summary>
        /// <param name="args">After query execute event arguments.</param>
        void IBeetleService.OnAfterQueryExecute(AfterQueryExecuteEventArgs args) {
            OnAfterQueryExecute(args);
        }

        /// <summary>
        /// Called when [after query execute].
        /// </summary>
        /// <param name="args">After query execute event arguments.</param>
        protected virtual void OnAfterQueryExecute(AfterQueryExecuteEventArgs args) {
            var handler = AfterQueryExecute;
            if (handler != null)
                handler(this, args);
        }

        /// <summary>
        /// Occurs before save.
        /// </summary>
        public event BeforeSaveDelegate BeforeSaveChanges;

        /// <summary>
        /// Called when [before save changes].
        /// </summary>
        /// <param name="args">The <see cref="BeforeSaveEventArgs"/> instance containing the event data.</param>
        protected virtual void OnBeforeSaveChanges(BeforeSaveEventArgs args) {
            var handler = BeforeSaveChanges;
            if (handler != null) handler(this, args);
        }

        /// <summary>
        /// Occurs after save.
        /// </summary>
        public event AfterSaveDelegate AfterSaveChanges;

        /// <summary>
        /// Called when [after save changes].
        /// </summary>
        /// <param name="args">The <see cref="AfterSaveEventArgs"/> instance containing the event data.</param>
        protected virtual void OnAfterSaveChanges(AfterSaveEventArgs args) {
            var handler = AfterSaveChanges;
            if (handler != null) handler(this, args);
        }

        #endregion

        #region Implementation of IODataService

        /// <summary>
        /// Occurs when [before handle query].
        /// </summary>
        public event BeforeODataQueryHandleDelegate BeforeODataQueryHandle;

        /// <summary>
        /// Called when [before handle query].
        /// </summary>
        /// <param name="args">The <see cref="BeforeQueryExecuteEventArgs" /> instance containing the event data.</param>
        void IODataService.OnBeforeODataQueryHandle(BeforeODataQueryHandleEventArgs args) {
            var handler = BeforeODataQueryHandle;
            if (handler != null)
                handler(this, args);
        }

        /// <summary>
        /// Called when [before handle query].
        /// </summary>
        /// <param name="args">The <see cref="BeforeQueryExecuteEventArgs" /> instance containing the event data.</param>
        protected void OnBeforeODataHandleQuery(BeforeODataQueryHandleEventArgs args) {
            ((IODataService)this).OnBeforeODataQueryHandle(args);
        }

        #endregion
    }
}