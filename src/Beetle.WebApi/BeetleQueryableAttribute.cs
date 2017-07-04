using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web.Http.Filters;
using System.Web.Http.OData;
using System.Web.Http.OData.Query;

namespace Beetle.WebApi {
    using Server;
    using Server.Interface;
    using Properties;

    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class BeetleQueryableAttribute : EnableQueryAttribute {

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
            GetParameters(service, out string queryString, out IList<BeetleParameter> parameters);
            if (parameters.Any() && ForbidBeetleParameters)
                throw new BeetleException(Resources.BeetleQueryStringsAreNotAllowed);

            var actionContext = new ActionContext(action, contentValue, queryString, parameters,
                                                  MaxResultCount, CheckRequestHash, Config, service);

            request.Properties["BeetleService"] = service;
            request.Properties["BeetleActionContext"] = actionContext;

            // call base and let WebApi process the request
            base.OnActionExecuted(actionExecutedContext);

            var processResult = ProcessRequest(actionContext, actionExecutedContext.Request);
            response.Content = HandleResponse(processResult);
        }

        public override IQueryable ApplyQuery(IQueryable queryable, ODataQueryOptions queryOptions) {
            var request = queryOptions.Request;

            // trigger the event on the service
            if (request.Properties.TryGetValue("BeetleService", out object serviceObj)
                    && request.Properties.TryGetValue("BeetleActionContext", out object actionObj)) {
                if (serviceObj is IODataService odataService) {
                    var actionContext = (ActionContext)actionObj;
                    var args = new BeforeODataQueryHandleEventArgs(actionContext, queryable, queryOptions);
                    odataService.OnBeforeODataQueryHandle(args);
                    queryable = args.Query;
                }
            }

            return base.ApplyQuery(queryable, queryOptions);
        }

        protected virtual void GetParameters(IBeetleService service, out string queryString, out IList<BeetleParameter> parameters) {
            var config = Config ?? service?.Config;
            Helper.GetParameters(config, out queryString, out parameters);
        }

        protected virtual ProcessResult ProcessRequest(ActionContext actionContext, HttpRequestMessage request) {
            var service = actionContext.Service;

            if (!string.IsNullOrEmpty(actionContext.QueryString)
                && (actionContext.CheckRequestHash ?? service?.CheckRequestHash) == true) {
                Helper.CheckRequestHash(actionContext.QueryString);
            }

            var processResult = service != null
                ? service.ProcessRequest(actionContext)
                : Server.Helper.DefaultRequestProcessor(actionContext);

            var inlineCountParam = actionContext.Parameters.LastOrDefault(p => p.Name == "$inlineCount");
            if (processResult.InlineCount == null && inlineCountParam?.Value == "allpages") {
                if (!request.Properties.TryGetValue("MS_InlineCount", out object inlineCount)) {
                    request.Properties.TryGetValue("BeetleInlineCountQuery", out object inlineCountQueryObj);
                    if (inlineCountQueryObj is IQueryable inlineCountQuery) {
                        processResult.InlineCount = Queryable.Count((dynamic)inlineCountQuery);
                    }
                }
                else {
                    processResult.InlineCount = (int)inlineCount;
                }
            }

            return processResult;
        }

        protected virtual ObjectContent HandleResponse(ProcessResult result) {
            return Helper.HandleResponse(result);
        }
    }
}
