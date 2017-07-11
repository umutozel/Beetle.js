using System;
using System.Linq;
using System.Net.Http;
using System.Web.Http.Filters;
using System.Net.Http.Formatting;

namespace Beetle.WebApi {
    using Server;
    using Server.Interface;
    using Properties;

    public class BeetleActionFilterAttribute : ActionFilterAttribute {

        public BeetleActionFilterAttribute() {
        }

        public BeetleActionFilterAttribute(Type configType) {
            var beetleConfig = Activator.CreateInstance(configType) as IBeetleConfig;
            Config = beetleConfig ?? throw new ArgumentException(Resources.CannotCreateConfigInstance);
        }

        public BeetleActionFilterAttribute(IBeetleConfig config) {
            Config = config;
        }

        protected IBeetleConfig Config { get; }

        protected virtual MediaTypeFormatter CreateFormatter() {
            return Helper.CreateFormatter(Config);
        }

        public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext) {
            base.OnActionExecuted(actionExecutedContext);

            if (actionExecutedContext.ActionContext.ActionDescriptor
                .GetCustomAttributes<NonBeetleActionAttribute>(false).Any()) return;

            var formatter = CreateFormatter();

            var response = actionExecutedContext.Response;
            if (!response.TryGetContentValue(out object contentValue)) return;

            if (contentValue != null) {
                response.Content = new ObjectContent(contentValue.GetType(), contentValue, formatter);
            }
        }
    }
}
