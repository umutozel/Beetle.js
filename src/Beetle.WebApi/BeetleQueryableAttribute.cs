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

namespace Beetle.WebApi {
    using Server;
    using Server.Interface;
    using Properties;

    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class BeetleQueryableAttribute : EnableQueryAttribute {
        private static readonly Lazy<BeetleQueryableAttribute> _instance = new Lazy<BeetleQueryableAttribute>();
        private static readonly MethodInfo _dummyMethodInfo;
        private readonly IBeetleConfig _beetleConfig;
        private bool? _checkRequestHash;

        static BeetleQueryableAttribute() {
            _dummyMethodInfo = typeof(BeetleApiController<>).GetMethods().First();
        }

        public BeetleQueryableAttribute() {
            AllowedQueryOptions = AllowedQueryOptions.Supported | AllowedQueryOptions.Expand | AllowedQueryOptions.Select;
        }

        public BeetleQueryableAttribute(IBeetleConfig config)
            : this() {
            _beetleConfig = config;
        }

        public BeetleQueryableAttribute(Type configType)
            : this() {
            if (configType != null) {
                _beetleConfig = Activator.CreateInstance(configType) as IBeetleConfig;
                if (_beetleConfig == null)
                    throw new ArgumentException(Resources.CannotCreateConfigInstance);
            }
        }

        public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext) {
            if (actionExecutedContext.Exception != null || !actionExecutedContext.Response.IsSuccessStatusCode) return;

            var request = actionExecutedContext.Request;
            var response = actionExecutedContext.Response;
            var controller = actionExecutedContext.ActionContext.ControllerContext.Controller;
            var action = actionExecutedContext.ActionContext.ActionDescriptor.ActionName;
            var service = controller as IBeetleService;

            // get query parameters
            string queryString;
            var queryParams = GetParameters(actionExecutedContext, out queryString, service);
            object contentValue;
            if (!response.TryGetContentValue(out contentValue)) return;

            var actionContext = new ActionContext(action, contentValue, queryString, queryParams, MaxResultCount, CheckRequestHashNullable);

            request.Properties["BeetleService"] = service;
            request.Properties["BeetleActionContext"] = actionContext;

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
            response.Content = HandleResponse(actionExecutedContext, processResult, service);
        }

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

        public virtual IQueryable FixODataQuery(IQueryable queryable, HttpRequestMessage request, IBeetleService service = null) {
            var queryableHandler = Server.Helper.GetQueryHandler(BeetleConfig, service);

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

        protected virtual NameValueCollection GetParameters(HttpActionExecutedContext actionExecutedContext, out string queryString, IBeetleService service = null) {
            var config = _beetleConfig ?? (service != null ? service.BeetleConfig : null);
            return Helper.GetParameters(config, out queryString);
        }

        protected virtual ProcessResult ProcessRequest(object contentValue, ActionContext actionContext, HttpRequestMessage request, IBeetleService service = null) {
            return service != null
                ? service.ProcessRequest(contentValue, actionContext, _beetleConfig)
                : Helper.ProcessRequest(contentValue, actionContext, request, actionConfig: _beetleConfig);
        }

        protected virtual ObjectContent HandleResponse(HttpActionExecutedContext filterContext, ProcessResult result, IBeetleService service = null) {
            var config = _beetleConfig ?? (service != null ? service.BeetleConfig : null);
            return Helper.HandleResponse(result, config);
        }

        internal static BeetleQueryableAttribute Instance {
            get { return _instance.Value; }
        }

        protected IBeetleConfig BeetleConfig {
            get { return _beetleConfig; }
        }

        public int MaxResultCount { get; set; }

        public bool CheckRequestHash {
            get { return _checkRequestHash.GetValueOrDefault(); }
            set { _checkRequestHash = value; }
        }

        internal bool? CheckRequestHashNullable {
            get { return _checkRequestHash; }
        }
    }
}
