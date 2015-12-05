using Beetle.Server.WebApi.Properties;
using System;
using System.Net.Http;
using System.Net.Http.Formatting;
using System.Net.Http.Headers;
using System.Text;
using System.Web.Http.Filters;

namespace Beetle.Server.WebApi {

    /// <summary>
    /// Can be used to modify serialization before respond is sent.
    /// </summary>
    public class BeetleActionFilterAttribute : ActionFilterAttribute {
        private MediaTypeFormatter _formatter;

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleActionFilterAttribute" /> class.
        /// </summary>
        /// <param name="configType">Type of the config.</param>
        /// <exception cref="System.ArgumentException">Cannot create config instance.</exception>
        public BeetleActionFilterAttribute(Type configType) {
            var beetleConfig = Activator.CreateInstance(configType) as BeetleConfig;
            if (beetleConfig == null)
                throw new ArgumentException(Resources.CannotCreateConfigInstance);

            CreateFormatter(beetleConfig);
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleActionFilterAttribute"/> class.
        /// </summary>
        /// <param name="config">The configuration.</param>
        public BeetleActionFilterAttribute(BeetleConfig config) {
            CreateFormatter(config);
        }

        private void CreateFormatter(BeetleConfig config) {
            _formatter = new BeetleMediaTypeFormatter { SerializerSettings = config.JsonSerializerSettings };
            _formatter.SupportedMediaTypes.Add(new MediaTypeHeaderValue("application/json"));
            _formatter.SupportedEncodings.Add(new UTF8Encoding(false, true));
        }

        /// <summary>
        /// Occurs after the action method is invoked.
        /// </summary>
        /// <param name="actionExecutedContext">The action executed context.</param>
        public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext) {
            base.OnActionExecuted(actionExecutedContext);

            var response = actionExecutedContext.Response;
            object contentValue;
            if (!response.TryGetContentValue(out contentValue)) return;

            if (contentValue != null)
                response.Content = new ObjectContent(contentValue.GetType(), contentValue, _formatter);
        }
    }
}
