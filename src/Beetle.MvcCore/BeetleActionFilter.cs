using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;

#if MVC_CORE_API
namespace Beetle.MvcCoreApi {
#else
namespace Beetle.MvcCore {
#endif
    using Server;
    using Server.Interface;
    using Properties;

    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class BeetleActionFilterAttribute : ActionFilterAttribute {

        public BeetleActionFilterAttribute(Type configType = null) {
            if (configType == null) return;

            Config = Activator.CreateInstance(configType) as IBeetleConfig;
            if (Config == null) throw new ArgumentException(Resources.CannotCreateConfigInstance);
        }

        public BeetleActionFilterAttribute(IBeetleConfig config) {
            Config = config;
        }

        protected IBeetleConfig Config { get; }

        public int MaxResultCount { get; set; }

        public bool? CheckRequestHash { get; set; }

        public override void OnActionExecuted(ActionExecutedContext filterContext) {
            base.OnActionExecuted(filterContext);

            if (!(filterContext.Result is ObjectResult objectResult)) return;

            if (filterContext.ActionDescriptor is ControllerActionDescriptor cad &&
                cad.MethodInfo.CustomAttributes.Any(a => a.AttributeType == typeof(NonBeetleActionAttribute))) return;

            var actionName = filterContext.ActionDescriptor.DisplayName;
            var contentValue = objectResult.Value;
            var service = filterContext.Controller as IBeetleService;
            var request = filterContext.HttpContext.Request;
            var response = filterContext.HttpContext.Response;
            // translate the request query
            GetParameters(service, request, out string queryString, out IList<BeetleParameter> parameters);
            var actionContext = new ActionContext(
                actionName, contentValue, queryString, parameters,
                MaxResultCount, CheckRequestHash, Config, service
            );
            var processResult = ProcessRequest(actionContext, request);
            Helper.SetCustomHeaders(processResult, response);
            filterContext.Result = HandleResponse(processResult, response);
        }

        protected virtual void GetParameters(IBeetleService service,
                                             HttpRequest request,
                                             out string queryString,
                                             out IList<BeetleParameter> parameters) {
            var config = Config ?? service?.Config;
            Helper.GetParameters(config, request, out queryString, out parameters);
        }

        protected virtual ProcessResult ProcessRequest(ActionContext actionContext, HttpRequest request) {
            var service = actionContext.Service;

            if (!string.IsNullOrEmpty(actionContext.QueryString)
                    && (actionContext.CheckRequestHash ?? service?.CheckRequestHash) == true) {
                Helper.CheckRequestHash(actionContext.QueryString, request);
            }

            return service != null
                ? service.ProcessRequest(actionContext)
                : Server.Helper.DefaultRequestProcessor(actionContext);
        }

        protected virtual ActionResult HandleResponse(ProcessResult result, HttpResponse response) {
            return Helper.HandleResponse(result, response);
        }
    }
}
