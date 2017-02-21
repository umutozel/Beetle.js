using System;
using System.Collections.Specialized;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using System.Web.Mvc;
using System.Web.Mvc.Async;
using Beetle.Server.Mvc.Properties;

namespace Beetle.Server.Mvc {

    /// <summary>
    /// Imitate OData behavior for MVC Controllers.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class BeetleActionFilterAttribute : ActionFilterAttribute {
        private readonly IBeetleConfig _beetleConfig;
        private bool? _checkRequestHash;

        public BeetleActionFilterAttribute(Type configType = null) {
            if (configType != null) {
                _beetleConfig = Activator.CreateInstance(configType) as IBeetleConfig;
                if (_beetleConfig == null)
                    throw new ArgumentException(Resources.CannotCreateConfigInstance);
            }
        }

        public BeetleActionFilterAttribute(IBeetleConfig config) {
            _beetleConfig = config;
        }

        public override void OnActionExecuting(ActionExecutingContext filterContext) {
            var controller = filterContext.Controller;
            var action = filterContext.ActionDescriptor;
            var service = controller as IBeetleService;

            string queryString;
            NameValueCollection queryParams;
            // handle request message
            GetParameters(filterContext, service, out queryString, out queryParams);
            filterContext.HttpContext.Items["BeetleQueryString"] = queryString;
            filterContext.HttpContext.Items["BeetleQueryParams"] = queryParams;

            base.OnActionExecuting(filterContext);

            MethodInfo actionMethod = null;

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
                    if (actionMethod == null) {
                        actionMethod = controller.GetType().GetMethod(
                            action.ActionName,
                            BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance | BindingFlags.InvokeMethod,
                            null,
                            action.GetParameters().Select(pd => pd.ParameterType).ToArray(),
                            null);

                        if (actionMethod == null) return;
                    }
                }
            }

            var returnType = actionMethod.ReturnType;
            // check if we can process the result of the action
            if (typeof(ActionResult).IsAssignableFrom(returnType) || typeof(Task).IsAssignableFrom(returnType))
                return;

            var parameters = filterContext.ActionParameters;
            // execute the action method
            var contentValue = action.Execute(filterContext.Controller.ControllerContext, parameters);
            var actionContext = new ActionContext(action.ActionName, contentValue, queryString, queryParams, MaxResultCount, CheckRequestHashNullable);
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

            var queryString = (string)filterContext.HttpContext.Items["BeetleQueryString"];
            var queryParams = (NameValueCollection)filterContext.HttpContext.Items["BeetleQueryParams"];

            var actionContext = new ActionContext(action.ActionName, contentValue, queryString, queryParams, MaxResultCount, CheckRequestHashNullable);
            var processResult = ProcessRequest(contentValue, actionContext, service);
            filterContext.Result = HandleResponse(filterContext, processResult, service);
        }

        protected virtual void GetParameters(ActionExecutingContext filterContext, IBeetleService service, out string queryString, out NameValueCollection queryParams) {
            var config = _beetleConfig ?? (service != null ? service.BeetleConfig : null);
            Helper.GetParameters(out queryString, out queryParams, config, filterContext.ActionDescriptor.GetParameters(), filterContext.ActionParameters);
        }

        protected virtual ProcessResult ProcessRequest(object contentValue, ActionContext actionContext, IBeetleService service) {
            return service != null
                ? service.ProcessRequest(contentValue, actionContext, _beetleConfig)
                : Helper.ProcessRequest(contentValue, actionContext, _beetleConfig);
        }

        protected virtual ActionResult HandleResponse(ControllerContext filterContext, ProcessResult result, IBeetleService service) {
            var config = _beetleConfig ?? (service != null ? service.BeetleConfig : null);
            return Helper.HandleResponse(result, config);
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
