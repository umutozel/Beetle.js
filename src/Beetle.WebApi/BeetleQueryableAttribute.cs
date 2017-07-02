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

        static BeetleQueryableAttribute() {
            _dummyMethodInfo = typeof(BeetleApiController<>).GetMethods().First();
        }

        public BeetleQueryableAttribute() {
            AllowedQueryOptions = AllowedQueryOptions.Supported | AllowedQueryOptions.Expand | AllowedQueryOptions.Select;
        }

        public BeetleQueryableAttribute(IBeetleConfig config) : this() {
            Config = config;
        }

        public BeetleQueryableAttribute(Type configType) : this() {
            if (configType == null) return;

            Config = Activator.CreateInstance(configType) as IBeetleConfig;
            if (Config == null) throw new ArgumentException(Resources.CannotCreateConfigInstance);
        }

        protected IBeetleConfig Config { get; }

        public int? MaxResultCount { get; set; }

        public bool? CheckRequestHash { get; set; }

        public bool ForbidBeetleParameters { get; set; }

        public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext) {
            if (actionExecutedContext.Exception != null || !actionExecutedContext.Response.IsSuccessStatusCode) return;

            var request = actionExecutedContext.Request;
            var response = actionExecutedContext.Response;
            var controller = actionExecutedContext.ActionContext.ControllerContext.Controller;
            var action = actionExecutedContext.ActionContext.ActionDescriptor.ActionName;
            var service = controller as IBeetleService;

            if (!response.TryGetContentValue(out object contentValue)) return;

            // get query parameters
            var queryParams = GetParameters(service, out string queryString);
            var beetleParams = Server.Helper.GetBeetleParameters(queryParams);

            if (beetleParams.Count > 0 && ForbidBeetleParameters)
                throw new BeetleException(Resources.BeetleQueryStringsAreNotAllowed);

            var actionContext = new ActionContext(action, contentValue, queryString, beetleParams, 
                                                  MaxResultCount, CheckRequestHash, Config, service);

            request.Properties["BeetleService"] = service;
            request.Properties["BeetleActionContext"] = actionContext;

            // call base and let WebApi process the request
            base.OnActionExecuted(actionExecutedContext);

            // get the processed query from content
            if (!response.TryGetContentValue(out contentValue)) return;

            // apply OData parameters
            if (contentValue is IQueryable queryable) {
                contentValue = FixODataQuery(queryable, request, service);
                actionContext = new ActionContext(action, contentValue, queryString, beetleParams, 
                                                  MaxResultCount, CheckRequestHash, Config, service);
            }

            var processResult = ProcessRequest(actionContext);
            response.Content = HandleResponse(actionExecutedContext, processResult, service);
        }

        public virtual IQueryable ApplyODataQuery(IQueryable queryable, ApiController controller, 
                                                  ActionContext actionContext, HttpRequestMessage request) {
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
            var orderBy = queryOptions.OrderBy?.RawValue;
            if (!string.IsNullOrWhiteSpace(orderBy) && orderBy.IndexOf('/') != -1) {
                queryable = queryable.OrderBy(orderBy.Replace('/', '.'));
                skipParams.Add("$orderby");
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
            if (request.Properties.TryGetValue("BeetleService", out object serviceObj)) {
                if (serviceObj is IODataService odataService) {
                    if (request.Properties.TryGetValue("BeetleActionContext", out object actionObj)) {
                        var actionContext = (ActionContext)actionObj;
                        var args = new BeforeODataQueryHandleEventArgs(actionContext, queryable, queryOptions);
                        odataService.OnBeforeODataQueryHandle(args);
                        queryable = args.Query;
                    }
                }
            }

            // and tell WebApi to handle modified query options, we will manually handle these skipped query options
            return base.ApplyQuery(queryable, queryOptions);
        }

        public virtual IQueryable FixODataQuery(IQueryable queryable, HttpRequestMessage request, IBeetleService service = null) {
            var queryableHandler = Server.Helper.GetQueryHandler(Config, service);

            // get OData parameters
            var queryParams = request.GetQueryNameValuePairs().ToList();

            // apply skipped query parameters
            var expand = queryParams.LastOrDefault(x => x.Key == "$expand").Value;
            if (!string.IsNullOrWhiteSpace(expand)) {
                queryable = queryableHandler.Include(queryable, expand.Replace('/', '.'));
            }

            var select = queryParams.LastOrDefault(x => x.Key == "$select").Value;
            if (!string.IsNullOrWhiteSpace(select)) {
                queryable = queryableHandler.Select(queryable, select.Replace('/', '.'));
            }

            // store query instance before applying skip and top
            request.Properties["BeetleInlineCountQuery"] = queryable;

            var skipStr = queryParams.LastOrDefault(x => x.Key == "$skip").Value;
            if (skipStr != null) {
                queryable = queryableHandler.Skip(queryable, int.Parse(skipStr));
            }

            var topStr = queryParams.LastOrDefault(x => x.Key == "$top").Value;
            if (topStr != null) {
                queryable = queryableHandler.Take(queryable, int.Parse(topStr));
            }

            return queryable;
        }

        protected virtual IDictionary<string, string> GetParameters(IBeetleService service, out string queryString) {
            var config = Config ?? service?.Config;
            return Helper.GetParameters(config, out queryString);
        }

        protected virtual ProcessResult ProcessRequest(ActionContext actionContext) {
            var service = actionContext.Service;
            return service != null
                ? service.ProcessRequest(actionContext)
                : Helper.ProcessRequest(actionContext);
        }

        protected virtual ObjectContent HandleResponse(HttpActionExecutedContext filterContext, ProcessResult result, IBeetleService service = null) {
            var config = Config ?? service?.Config;
            return Helper.HandleResponse(result, config);
        }

        internal static BeetleQueryableAttribute Instance => _instance.Value;
    }
}
