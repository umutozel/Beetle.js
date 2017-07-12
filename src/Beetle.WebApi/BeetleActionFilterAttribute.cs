using System;
using System.Linq;
using System.Net.Http;
using System.Web.Http.Filters;

namespace Beetle.WebApi {
    using Server;
    using Server.Interface;
    using Properties;

    public class BeetleActionFilterAttribute : ActionFilterAttribute {

        public BeetleActionFilterAttribute() {
        }

        public BeetleActionFilterAttribute(Type configType) {
            var beetleConfig = Activator.CreateInstance(configType) as IBeetleApiConfig;
            Config = beetleConfig ?? throw new ArgumentException(Resources.CannotCreateConfigInstance);
        }

        public BeetleActionFilterAttribute(IBeetleApiConfig config) {
            Config = config;
        }

        public IBeetleApiConfig Config { get; }

        public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext) {
            base.OnActionExecuted(actionExecutedContext);

            if (actionExecutedContext.ActionContext.ActionDescriptor
                .GetCustomAttributes<NonBeetleActionAttribute>(false).Any()) return;

            var response = actionExecutedContext.Response;
            if (!response.TryGetContentValue(out object contentValue)) return;

            var controller = actionExecutedContext.ActionContext.ControllerContext.Controller;
            var service = controller as IBeetleService;
            var config = Config ?? service?.Config as IBeetleApiConfig ?? BeetleApiConfig.Instance;
            var formatter = config.CreateFormatter();

            if (contentValue != null) {
                response.Content = new ObjectContent(contentValue.GetType(), contentValue, formatter);
            }
        }
    }
}
