using System;
using System.Collections.Specialized;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Mvc;
using Beetle.Server.Mvc.Properties;

namespace Beetle.Server.Mvc {

    /// <summary>
    /// Imitate OData behavior for MVC Controllers.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class BeetleActionFilterAttribute : ActionFilterAttribute {
        private readonly BeetleConfig _beetleConfig;
        private bool? _checkRequestHash;

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleActionFilterAttribute" /> class.
        /// </summary>
        /// <param name="configType">Type of the config.</param>
        /// <exception cref="System.ArgumentException">Cannot create config instance.</exception>
        public BeetleActionFilterAttribute(Type configType = null) {
            if (configType != null) {
                _beetleConfig = Activator.CreateInstance(configType) as BeetleConfig;
                if (_beetleConfig == null)
                    throw new ArgumentException(Resources.CannotCreateConfigInstance);
            }
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleActionFilterAttribute"/> class.
        /// </summary>
        /// <param name="config">The configuration.</param>
        public BeetleActionFilterAttribute(BeetleConfig config) {
            _beetleConfig = config;
        }

        /// <summary>
        /// Called by the ASP.NET MVC framework before the action method executes.
        /// </summary>
        /// <param name="filterContext">The filter context.</param>
        public override void OnActionExecuting(ActionExecutingContext filterContext) {
            var defaultFactory = ValueProviderFactories.Factories.OfType<JsonValueProviderFactory>().SingleOrDefault();
            if (defaultFactory != null) {
                ValueProviderFactories.Factories.Remove(defaultFactory);
            }
            else {
                var beetleFactory = ValueProviderFactories.Factories.OfType<BeetleValueProviderFactory>().SingleOrDefault();
                ValueProviderFactories.Factories.Remove(beetleFactory);
            }

            ValueProviderFactories.Factories.Add(new BeetleValueProviderFactory(_beetleConfig ?? BeetleConfig.Instance));

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

            var actionMethod = controller.GetType().GetMethod(action.ActionName, action.GetParameters().Select(pd => pd.ParameterType).ToArray());
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

        /// <summary>
        /// Called by the ASP.NET MVC framework after the action method executed.
        /// </summary>
        /// <param name="filterContext">The filter context.</param>
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

            var queryString = (string) filterContext.HttpContext.Items["BeetleQueryString"];
            var queryParams = (NameValueCollection) filterContext.HttpContext.Items["BeetleQueryParams"];

            var actionContext = new ActionContext(action.ActionName, contentValue, queryString, queryParams, MaxResultCount, CheckRequestHashNullable);
            var processResult = ProcessRequest(contentValue, actionContext, service);
            filterContext.Result = HandleResponse(filterContext, processResult, service);
        }

        /// <summary>
        /// Handles the request.
        /// </summary>
        /// <param name="filterContext">The filter context.</param>
        /// <param name="service">The beetle service.</param>
        /// <param name="queryString">The query string.</param>
        /// <param name="queryParams">The query parameters.</param>
        protected virtual void GetParameters(ActionExecutingContext filterContext, IBeetleService service, out string queryString, out NameValueCollection queryParams) {
            var config = _beetleConfig ?? (service != null ? service.BeetleConfig : null) ?? BeetleConfig.Instance;
            Helper.GetParameters(out queryString, out queryParams, config, filterContext.ActionDescriptor.GetParameters(), filterContext.ActionParameters);
        }

        /// <summary>
        /// Processes the request.
        /// </summary>
        /// <param name="contentValue">The content value.</param>
        /// <param name="actionContext">The action context.</param>
        /// <param name="service">The beetle service.</param>
        /// <returns></returns>
        protected virtual ProcessResult ProcessRequest(object contentValue, ActionContext actionContext, IBeetleService service) {
            return service != null
                ? service.ProcessRequest(contentValue, actionContext, _beetleConfig)
                : Helper.ProcessRequest(contentValue, actionContext, _beetleConfig);
        }

        /// <summary>
        /// Handles the response.
        /// </summary>
        /// <param name="filterContext">The filter context.</param>
        /// <param name="result">The process result.</param>
        /// <param name="service">The beetle service.</param>
        /// <returns></returns>
        protected virtual ActionResult HandleResponse(ControllerContext filterContext, ProcessResult result, IBeetleService service) {
            var config = _beetleConfig ?? (service != null ? service.BeetleConfig : null) ?? BeetleConfig.Instance;
            return Helper.HandleResponse(result, config);
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
