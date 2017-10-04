using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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

        public IBeetleConfig Config { get; }

        public int MaxResultCount { get; set; }

        public override void OnActionExecuted(ActionExecutedContext context) {
            base.OnActionExecuted(context);

            if (!(context.Result is ObjectResult objectResult)) return;

            if (context.ActionDescriptor is ControllerActionDescriptor cad 
                    && cad.MethodInfo.CustomAttributes.Any(a => a.AttributeType == typeof(NonBeetleActionAttribute))) return;

            var actionName = context.ActionDescriptor.DisplayName;
            var contentValue = objectResult.Value;
            var service = context.Controller as IBeetleService;
            var request = context.HttpContext.Request;
            var response = context.HttpContext.Response;
            // translate the request query
            GetParameters(service, context, out IList<BeetleParameter> parameters);
            var actionContext = new ActionContext(
                actionName, contentValue, parameters,
                MaxResultCount, Config, service
            );
            var processResult = ProcessRequest(actionContext, request);
            Helper.SetCustomHeaders(processResult, response);
            context.Result = HandleResponse(processResult, response);
        }

        protected virtual void GetParameters(IBeetleService service,
                                             ActionExecutedContext context,
                                             out IList<BeetleParameter> parameters) {
            var config = Config ?? service?.Config;
            Helper.GetParameters(config, context.HttpContext.Request, out parameters);
        }

        protected virtual ProcessResult ProcessRequest(ActionContext actionContext, HttpRequest request) {
            var service = actionContext.Service;

            return service != null
                ? service.ProcessRequest(actionContext)
                : Server.Helper.DefaultRequestProcessor(actionContext);
        }

        protected virtual ActionResult HandleResponse(ProcessResult result, HttpResponse response) {
            return Helper.HandleResponse(result, response);
        }
    }
}
