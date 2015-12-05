using Beetle.Server.WebApi.Properties;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Linq.Dynamic;
using System.Net.Http;
using System.Reflection;
using System.Web;
using System.Web.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;
using System.Web.Http.OData;
using System.Web.Http.OData.Query;

namespace Beetle.Server.WebApi {

    /// <summary>
    /// Interpret OData behavior on top of WebApi.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class BeetleQueryableAttribute : QueryableAttribute {
        private static readonly Lazy<BeetleQueryableAttribute> _instance = new Lazy<BeetleQueryableAttribute>();
        private static readonly MethodInfo _dummyMethodInfo;
        private BeetleConfig _beetleConfig;
        private bool? _checkRequestHash;

        /// <summary>
        /// Initializes the <see cref="BeetleApiController{TContextHandler}"/> class.
        /// </summary>
        static BeetleQueryableAttribute() {
            _dummyMethodInfo = typeof(BeetleApiController<>).GetMethods().First();
        }

        public BeetleQueryableAttribute() {
            AllowedQueryOptions = AllowedQueryOptions.Supported | AllowedQueryOptions.Expand | AllowedQueryOptions.Select;
        }

        public BeetleQueryableAttribute(BeetleConfig config)
            : this() {
            _beetleConfig = config;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleQueryableAttribute" /> class.
        /// </summary>
        /// <param name="configType">Type of the config.</param>
        /// <exception cref="System.ArgumentException">Cannot create config instance.</exception>
        public BeetleQueryableAttribute(Type configType)
            : this() {
            if (configType != null) {
                _beetleConfig = Activator.CreateInstance(configType) as BeetleConfig;
                if (_beetleConfig == null)
                    throw new ArgumentException(Resources.CannotCreateConfigInstance);
            }
        }

        /// <summary>
        /// Called when [action executed].
        /// </summary>
        /// <param name="actionExecutedContext">The action executed context.</param>
        public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext) {
            if (actionExecutedContext.Exception != null || !actionExecutedContext.Response.IsSuccessStatusCode) return;

            var request = actionExecutedContext.Request;
            var response = actionExecutedContext.Response;
            var controller = actionExecutedContext.ActionContext.ControllerContext.Controller;
            var action = actionExecutedContext.ActionContext.ActionDescriptor.ActionName;
            var service = controller as IBeetleService;

            // get query parameters
            string queryString;
            var queryParams = GetParameters(actionExecutedContext, out queryString);
            object contentValue;
            if (!response.TryGetContentValue(out contentValue)) return;

            var actionContext = new ActionContext(action, contentValue, queryString, queryParams, MaxResultCount, CheckRequestHashNullable);

            request.Properties["BeetleService"] = service;
            request.Properties["BeetleActionContext"] = actionContext;

            if (_beetleConfig == null)
                _beetleConfig = service != null ? service.BeetleConfig : BeetleConfig.Instance;

            // call base and let WebApi process the request
            base.OnActionExecuted(actionExecutedContext);

            // get the processed query from content
            if (!response.TryGetContentValue(out contentValue)) return;
            var queryable = contentValue as IQueryable;

            // apply OData parameters
            if (queryable != null)
                contentValue = FixODataQuery(queryable, request, service);

            // process the request and return the result
            var processResult = ProcessRequest(contentValue, actionContext, request, service);
            // handle response message
            response.Content = HandleResponse(actionExecutedContext, processResult);
        }

        /// <summary>
        /// Applies the o data query.
        /// </summary>
        /// <param name="queryable">The queryable.</param>
        /// <param name="controller">The controller.</param>
        /// <param name="actionContext">The action context.</param>
        /// <param name="request">The request.</param>
        /// <returns></returns>
        public virtual IQueryable ApplyODataQuery(IQueryable queryable, ApiController controller, ActionContext actionContext, HttpRequestMessage request) {
            // if value is a query, first handle OData parameters
            var edmModel = GetModel(queryable.ElementType, request,
                new ReflectedHttpActionDescriptor(controller.ControllerContext.ControllerDescriptor, _dummyMethodInfo));
            // create necessary objects to query to be handled by WebApi
            var odataQueryContext = new ODataQueryContext(edmModel, queryable.ElementType);
            var odataQueryOptions = new ODataQueryOptions(odataQueryContext, request);
            // we need this to be able to access service in ApplyQuery method
            var service = controller as IBeetleService;
            request.Properties["BeetleService"] = service;
            request.Properties["BeetleActionContext"] = actionContext;
            // let WebApi engine apply the query
            queryable = ApplyQuery(queryable, odataQueryOptions);
            // apply skipped query parameters
            return FixODataQuery(queryable, request, service);
        }

        /// <summary>
        /// Applies the query.
        /// </summary>
        /// <param name="queryable">The queryable.</param>
        /// <param name="queryOptions">The query options.</param>
        /// <returns>
        /// The queryable.
        /// </returns>
        public override IQueryable ApplyQuery(IQueryable queryable, ODataQueryOptions queryOptions) {
            var request = queryOptions.Request;
            var queryString = request.RequestUri.ParseQueryString();
            var oldUri = request.RequestUri;

            // WebApi cannot process these query string options
            var skipParams = new List<string> { "$expand", "$select", "$skip", "$top" };
            if (queryOptions.OrderBy != null) {
                var orderBy = queryOptions.OrderBy.RawValue;
                if (!string.IsNullOrWhiteSpace(orderBy) && orderBy.IndexOf('/') != -1) {
                    queryable = queryable.OrderBy(orderBy.Replace('/', '.'));
                    skipParams.Add("$orderby");
                }
            }

            // we create new query options
            var queryParams = queryString.Cast<string>().Where(k => !skipParams.Contains(k)).ToList();
            if (queryString.AllKeys.Length != queryParams.Count) {
                var newQuery = string.Join("&", queryParams.Select(k => k + "=" + HttpUtility.UrlEncode(queryString[k])));
                var newUri = oldUri.Scheme + "://" + oldUri.Authority + oldUri.AbsolutePath + "?" + newQuery;
                var newRequest = new HttpRequestMessage(request.Method, new Uri(newUri));
                queryOptions = new ODataQueryOptions(queryOptions.Context, newRequest);
            }

            // trigger the event on the service
            object serviceObj;
            if (request.Properties.TryGetValue("BeetleService", out serviceObj)) {
                var odataService = serviceObj as IODataService;
                if (odataService != null) {
                    object actionObj;
                    ActionContext actionContext;
                    if (request.Properties.TryGetValue("BeetleActionContext", out actionObj) && actionObj != null)
                        actionContext = (ActionContext)actionObj;
                    else
                        actionContext = new ActionContext();

                    var args = new BeforeODataQueryHandleEventArgs(actionContext, queryable, queryOptions);
                    odataService.OnBeforeODataQueryHandle(args);
                    queryable = args.Query;
                }
            }

            // and tell WebApi to handle modified query options, we will manually handle these skipped query options
            return base.ApplyQuery(queryable, queryOptions);
        }

        /// <summary>
        /// Fixes the o data query.
        /// </summary>
        /// <param name="queryable">The queryable.</param>
        /// <param name="request">The request.</param>
        /// <param name="service">The service.</param>
        /// <returns></returns>
        public virtual IQueryable FixODataQuery(IQueryable queryable, HttpRequestMessage request, IBeetleService service = null) {
            var queryableHandler = service != null && service.ContextHandler != null
                ? service.ContextHandler.QueryableHandler
                : QueryableHandler.Instance;

            // get OData parameters
            var queryParams = request.GetQueryNameValuePairs().ToList();

            // apply skipped query parameters
            var expand = queryParams.LastOrDefault(x => x.Key == "$expand").Value;
            if (!string.IsNullOrWhiteSpace(expand))
                queryable = queryableHandler.HandleInclude(queryable, expand.Replace('/', '.'));

            var select = queryParams.LastOrDefault(x => x.Key == "$select").Value;
            if (!string.IsNullOrWhiteSpace(select))
                queryable = queryableHandler.HandleSelect(queryable, select.Replace('/', '.'));

            // store query instance before applying skip and top
            request.Properties["BeetleInlineCountQuery"] = queryable;

            var skipStr = queryParams.LastOrDefault(x => x.Key == "$skip").Value;
            if (skipStr != null)
                queryable = queryableHandler.HandleSkip(queryable, int.Parse(skipStr));

            var topStr = queryParams.LastOrDefault(x => x.Key == "$top").Value;
            if (topStr != null)
                queryable = queryableHandler.HandleTake(queryable, int.Parse(topStr));

            return queryable;
        }

        /// <summary>
        /// Handles the request.
        /// </summary>
        /// <param name="queryString">The query string.</param>
        /// <param name="actionExecutedContext">The action executed context.</param>
        /// <returns>
        /// The query parameters.
        /// </returns>
        protected virtual NameValueCollection GetParameters(HttpActionExecutedContext actionExecutedContext, out string queryString) {
            return Helper.GetParameters(out queryString);
        }

        /// <summary>
        /// Processes the request.
        /// </summary>
        /// <param name="contentValue">The content value.</param>
        /// <param name="actionContext">The action context.</param>
        /// <param name="request">The request.</param>
        /// <param name="service">The service.</param>
        /// <returns></returns>
        protected virtual ProcessResult ProcessRequest(object contentValue, ActionContext actionContext,
                                                       HttpRequestMessage request, IBeetleService service) {
            return service != null
                ? service.ProcessRequest(contentValue, actionContext)
                : Helper.ProcessRequest(contentValue, actionContext, request);
        }

        /// <summary>
        /// Handles the response.
        /// </summary>
        /// <param name="filterContext">The filter context.</param>
        /// <param name="result">The result.</param>
        /// <returns></returns>
        protected virtual ObjectContent HandleResponse(HttpActionExecutedContext filterContext, ProcessResult result) {
            return Helper.HandleResponse(result, _beetleConfig);
        }

        /// <summary>
        /// Gets the instance.
        /// </summary>
        /// <value>
        /// The instance.
        /// </value>
        internal static BeetleQueryableAttribute Instance {
            get { return _instance.Value; }
        }

        /// <summary>
        /// Gets the beetle config.
        /// </summary>
        /// <value>
        /// The beetle config.
        /// </value>
        protected BeetleConfig BeetleConfig {
            get { return _beetleConfig; }
        }

        /// <summary>
        /// Gets or sets the maximum result count.
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
        public bool CheckRequestHash {
            get { return _checkRequestHash.GetValueOrDefault(); }
            set { _checkRequestHash = value; }
        }

        /// <summary>
        /// Gets the check request hash nullable.
        /// </summary>
        /// <value>
        /// The check request hash nullable.
        /// </value>
        internal bool? CheckRequestHashNullable {
            get { return _checkRequestHash; }
        }
    }
}
