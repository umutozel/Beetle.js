using Beetle.Server.WebApi.Properties;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Web.Http.Filters;

namespace Beetle.Server.WebApi {

    /// <summary>
    /// Can be used to modify serialization before respond is sent.
    /// </summary>
    public class BeetleActionFilterAttribute : ActionFilterAttribute {
        private BeetleConfig _config;

        public BeetleActionFilterAttribute() {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleActionFilterAttribute" /> class.
        /// </summary>
        /// <param name="configType">Type of the config.</param>
        /// <exception cref="System.ArgumentException">Cannot create config instance.</exception>
        public BeetleActionFilterAttribute(Type configType) {
            var beetleConfig = Activator.CreateInstance(configType) as BeetleConfig;
            if (beetleConfig == null)
                throw new ArgumentException(Resources.CannotCreateConfigInstance);
            _config = beetleConfig;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleActionFilterAttribute"/> class.
        /// </summary>
        /// <param name="config">The configuration.</param>
        public BeetleActionFilterAttribute(BeetleConfig config) {
            _config = config;
        }

        private BeetleMediaTypeFormatter CreateFormatter(BeetleConfig config) {
            var formatter = new BeetleMediaTypeFormatter { SerializerSettings = config.JsonSerializerSettings };
            formatter.SupportedMediaTypes.Add(new MediaTypeHeaderValue("application/json"));
            formatter.SupportedEncodings.Add(new UTF8Encoding(false, true));
            return formatter;
        }

        /// <summary>
        /// Occurs after the action method is invoked.
        /// </summary>
        /// <param name="actionExecutedContext">The action executed context.</param>
        public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext) {
            if (_config == null) {
                var service = actionExecutedContext.ActionContext.ControllerContext.Controller as IBeetleService;
                _config = service != null ? service.BeetleConfig : BeetleConfig.Instance;
            }
            var formatter = CreateFormatter(_config);

            base.OnActionExecuted(actionExecutedContext);

            var response = actionExecutedContext.Response;
            object contentValue;
            if (!response.TryGetContentValue(out contentValue)) return;

            if (contentValue != null)
                response.Content = new ObjectContent(contentValue.GetType(), contentValue, formatter);
        }
    }
}
