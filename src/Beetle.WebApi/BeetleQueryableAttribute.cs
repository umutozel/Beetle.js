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

        public BeetleQueryableAttribute(IBeetleApiConfig config) : this() {
            Config = config;
        }

        public BeetleQueryableAttribute(Type configType) : this() {
            var config = Activator.CreateInstance(configType) as IBeetleApiConfig;
            if (config == null) throw new ArgumentException(Resources.CannotCreateConfigInstance);
        }

        public IBeetleApiConfig Config { get; }

        public int? MaxResultCount { get; set; }

        public bool ForbidBeetleParameters { get; set; }

        public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext) {
            var request = actionExecutedContext.Request;
            var response = actionExecutedContext.Response;
            var controller = actionExecutedContext.ActionContext.ControllerContext.Controller;
            var action = actionExecutedContext.ActionContext.ActionDescriptor.ActionName;
            var service = controller as IBeetleService;

            if (!response.TryGetContentValue(out object contentValue)) return;

            // get query parameters
            GetParameters(service, out IList<BeetleParameter> parameters);
            if (parameters.Any() && ForbidBeetleParameters)
                throw new BeetleException(Resources.BeetleQueryStringsAreNotAllowed);

            var actionContext = new ActionContext(action, contentValue, parameters,
                                                  MaxResultCount, Config, service);

            request.Properties["BeetleActionContext"] = actionContext;

            // call base and let WebApi process the request
            base.OnActionExecuted(actionExecutedContext);

            // get modified content value
            if (!response.TryGetContentValue(out contentValue)) return;

            actionContext = new ActionContext(action, contentValue, parameters,
                                              MaxResultCount, Config, service);
            var processResult = ProcessRequest(actionContext, actionExecutedContext.Request);
            Helper.SetCustomHeaders(processResult);
            response.Content = HandleResponse(processResult);
        }

        public override IQueryable ApplyQuery(IQueryable queryable, ODataQueryOptions queryOptions) {
            var request = queryOptions.Request;

            // trigger the event on the service
            if (request.Properties.TryGetValue("BeetleActionContext", out object actionObj)) {
                var actionContext = (ActionContext)actionObj;
                if (actionContext.Service is IODataService odataService) {
                    var args = new BeforeODataQueryHandleEventArgs(actionContext, queryable, queryOptions);
                    odataService.OnBeforeODataQueryHandle(args);
                    queryable = args.Query;
                }
            }

            return base.ApplyQuery(queryable, queryOptions);
        }

        protected virtual void GetParameters(IBeetleService service, out IList<BeetleParameter> parameters) {
            var config = Config ?? service?.Config;
            Helper.GetParameters(config, out parameters);
        }

        protected virtual ProcessResult ProcessRequest(ActionContext actionContext, HttpRequestMessage request) {
            var service = actionContext.Service;

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
