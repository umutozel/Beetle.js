using Beetle.Server.WebApi.Properties;
using System;
using System.Net.Http;
using System.Web.Http.Filters;

namespace Beetle.Server.WebApi {

    /// <summary>
    /// Can be used to modify serialization before respond is sent.
    /// </summary>
    public class BeetleActionFilterAttribute : ActionFilterAttribute {
        private readonly BeetleConfig _beetleConfig;

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleActionFilterAttribute" /> class.
        /// </summary>
        /// <param name="configType">Type of the config.</param>
        /// <exception cref="System.ArgumentException">Cannot create config instance.</exception>
        public BeetleActionFilterAttribute(Type configType) {
            _beetleConfig = Activator.CreateInstance(configType) as BeetleConfig;
            if (_beetleConfig == null)
                throw new ArgumentException(Resources.CannotCreateConfigInstance);
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleActionFilterAttribute"/> class.
        /// </summary>
        /// <param name="config">The configuration.</param>
        public BeetleActionFilterAttribute(BeetleConfig config) {
            _beetleConfig = config;
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
                response.Content = new ObjectContent(
                    contentValue.GetType(), contentValue, _beetleConfig.MediaTypeFormatter
                );
        }
    }
}
