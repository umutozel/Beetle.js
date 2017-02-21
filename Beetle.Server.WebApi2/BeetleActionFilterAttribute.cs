using Beetle.Server.WebApi.Properties;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Web.Http.Filters;
using System.Net.Http.Formatting;

namespace Beetle.Server.WebApi {

    public class BeetleActionFilterAttribute : ActionFilterAttribute {
        private readonly IBeetleConfig _config;

        public BeetleActionFilterAttribute() {
        }

        public BeetleActionFilterAttribute(Type configType) {
            var beetleConfig = Activator.CreateInstance(configType) as IBeetleConfig;
            if (beetleConfig == null)
                throw new ArgumentException(Resources.CannotCreateConfigInstance);
            _config = beetleConfig;
        }

        public BeetleActionFilterAttribute(IBeetleConfig config) {
            _config = config;
        }

        protected IBeetleConfig Config {
            get { return _config; }
        }

        protected virtual MediaTypeFormatter CreateFormatter() {
            return Helper.CreateFormatter(_config);
        }

        public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext) {
            var formatter = CreateFormatter();

            base.OnActionExecuted(actionExecutedContext);

            var response = actionExecutedContext.Response;
            object contentValue;
            if (!response.TryGetContentValue(out contentValue)) return;

            if (contentValue != null)
                response.Content = new ObjectContent(contentValue.GetType(), contentValue, formatter);
        }
    }
}
