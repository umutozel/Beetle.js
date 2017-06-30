using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
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
            if (configType != null) {
                Config = Activator.CreateInstance(configType) as IBeetleConfig;
                if (Config == null) throw new ArgumentException(Resources.CannotCreateConfigInstance);
            }
        }

        public BeetleActionFilterAttribute(IBeetleConfig config) {
            Config = config;
        }

        public override void OnActionExecuting(ActionExecutingContext filterContext) {
            var controller = filterContext.Controller;
            var action = filterContext.ActionDescriptor;
            var service = controller as IBeetleService;

            base.OnActionExecuting(filterContext);

            MethodInfo actionMethod;
            var reflectedAction = action as ReflectedActionDescriptor;
            if (reflectedAction != null) {
                actionMethod = reflectedAction.MethodInfo;
            }
            else {
                var taskAsyncAction = action as TaskAsyncActionDescriptor;
                if (taskAsyncAction != null) {
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
            // check if we can process the result of the action
            if (typeof(ActionResult).IsAssignableFrom(returnType) || typeof(Task).IsAssignableFrom(returnType))
                return;

            // translate the request query
            GetParameters(filterContext, service, out string queryString, out IDictionary<string, string> queryParams);
            // execute the action method
            var parameters = filterContext.ActionParameters;
            var beetleParameters = Server.Helper.GetBeetleParameters(queryParams);
            var contentValue = action.Execute(filterContext.Controller.ControllerContext, parameters);
            var actionContext = new ActionContext(action.ActionName, contentValue, 
                                                  queryString, beetleParameters, 
                                                  MaxResultCount, CheckRequestHashNullable, 
                                                  Config, service);
            var processResult = ProcessRequest(contentValue, actionContext, service);
            filterContext.Result = HandleResponse(filterContext, processResult, service);
        }

        public override void OnActionExecuted(ActionExecutedContext filterContext) {
            base.OnActionExecuted(filterContext);

            object contentValue;
            var contentResult = filterContext.Result as BeetleContentResult;
            if (contentResult != null)
                contentValue = contentResult.Value;
            else return;

            var controller = filterContext.Controller;
            var action = filterContext.ActionDescriptor;
            var service = controller as IBeetleService;

            // translate the request query
            GetParameters(filterContext, service, out string queryString, out IDictionary<string, string> queryParams);

            var beetlePrms = Server.Helper.GetBeetleParameters(queryParams);
            var actionContext = new ActionContext(action.ActionName, contentValue, 
                                                  queryString, beetlePrms, 
                                                  MaxResultCount, CheckRequestHashNullable,
                                                  Config, service);
            var processResult = ProcessRequest(contentValue, actionContext, service);
            filterContext.Result = HandleResponse(filterContext, processResult, service);
        }

        protected virtual void GetParameters(ActionExecutingContext filterContext, IBeetleService service, 
                                             out string queryString, out IDictionary<string, string> queryParams) {
            var config = Config ?? service?.Config;
            Helper.GetParameters(
                out queryString, out queryParams, config, 
                filterContext.ActionDescriptor.GetParameters(), 
                filterContext.ActionParameters
            );
        }

        protected virtual ProcessResult ProcessRequest(object contentValue, ActionContext actionContext, IBeetleService service) {
            return service != null
                ? service.ProcessRequest(actionContext)
                : Helper.ProcessRequest(actionContext);
        }

        protected virtual ActionResult HandleResponse(ControllerContext filterContext, ProcessResult result, IBeetleService service) {
            var config = Config ?? service?.Config;
            return Helper.HandleResponse(result, config);
        }

        protected IBeetleConfig Config { get; }

        public int MaxResultCount { get; set; }

        public bool CheckRequestHash {
            get => CheckRequestHashNullable.GetValueOrDefault();
            set => CheckRequestHashNullable = value;
        }

        internal bool? CheckRequestHashNullable { get; private set; }
    }
}
