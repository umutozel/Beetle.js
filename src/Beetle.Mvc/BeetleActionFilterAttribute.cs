using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Web.Mvc;
using System.Web.Mvc.Async;

namespace Beetle.Mvc {
    using Server;
    using Server.Interface;
    using Properties;

    /// <summary>
    /// Imitate OData behavior for MVC Controllers.
    /// </summary>
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

        public override void OnActionExecuting(ActionExecutingContext filterContext) {
            base.OnActionExecuting(filterContext);

            var controller = filterContext.Controller;
            var action = filterContext.ActionDescriptor;

            MethodInfo actionMethod;
            if (action is ReflectedActionDescriptor reflectedAction) {
                actionMethod = reflectedAction.MethodInfo;
            }
            else {
                if (action is TaskAsyncActionDescriptor taskAsyncAction) {
                    actionMethod = taskAsyncAction.TaskMethodInfo;
                }
                else {
                    actionMethod = controller.GetType().GetMethod(
                        action.ActionName,
                        BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance | BindingFlags.InvokeMethod,
                        null,
                        action.GetParameters().Select(pd => pd.ParameterType).ToArray(),
                        null);

                    if (actionMethod == null) return;
                }
            }

            var returnType = actionMethod.ReturnType;
            // check if we should process the result of the action
            if (typeof(ActionResult).IsAssignableFrom(returnType) || typeof(Task).IsAssignableFrom(returnType))
                return;

            var service = controller as IBeetleService;
            GetParameters(service, out string queryString, out IList<BeetleParameter> parameters, out dynamic postData);

            if (postData != null) {
                // fix parameter values for object and dynamic parameters
                foreach (var pd in filterContext.ActionDescriptor.GetParameters()) {
                    var t = pd.ParameterType;
                    if (t == typeof(object) || pd.GetCustomAttributes(typeof(DynamicAttribute), false).Any()) {
                        filterContext.ActionParameters[pd.ParameterName] = postData;
                    }
                }
            }

            var contentValue = action.Execute(filterContext.Controller.ControllerContext, filterContext.ActionParameters);
            filterContext.Result = ProcessAction(action.ActionName, contentValue, queryString, parameters, service);
        }

        public override void OnActionExecuted(ActionExecutedContext filterContext) {
            base.OnActionExecuted(filterContext);

            if (!(filterContext.Result is BeetleContentResult contentResult)) return;

            var service = filterContext.Controller as IBeetleService;
            GetParameters(service, out string queryString, out IList<BeetleParameter> parameters, out dynamic _);
            filterContext.Result = ProcessAction(filterContext.ActionDescriptor.ActionName,
                                                 contentResult.Value, queryString, parameters, service);
        }

        private ActionResult ProcessAction(string actionName, object contentValue, string queryString,
                                           IEnumerable<BeetleParameter> parameters, IBeetleService service) {
            // translate the request query
            var actionContext = new ActionContext(
                actionName, contentValue, queryString, parameters,
                MaxResultCount, CheckRequestHash, Config, service
            );
            var processResult = ProcessRequest(actionContext);
            Helper.SetCustomHeaders(processResult);
            return HandleResponse(processResult);
        }

        protected virtual void GetParameters(IBeetleService service,
                                             out string queryString,
                                             out IList<BeetleParameter> parameters, out dynamic postData) {
            var config = Config ?? service?.Config;
            Helper.GetParameters(config, out queryString, out parameters, out postData);
        }

        protected virtual ProcessResult ProcessRequest(ActionContext actionContext) {
            var service = actionContext.Service;

            if (!string.IsNullOrEmpty(actionContext.QueryString)
                    && (actionContext.CheckRequestHash ?? service?.CheckRequestHash) == true) {
                Helper.CheckRequestHash(actionContext.QueryString);
            }

            return service != null
                ? service.ProcessRequest(actionContext)
                : Server.Helper.DefaultRequestProcessor(actionContext);
        }

        protected virtual ActionResult HandleResponse(ProcessResult result) {
            return Helper.HandleResponse(result);
        }
    }
}
