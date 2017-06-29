using System;
using System.Web.Helpers;
using System.Web.Mvc;

namespace Beetle.Mvc {

    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class ValidateJsonAntiForgeryTokenAttribute : FilterAttribute, IAuthorizationFilter {

        public void OnAuthorization(AuthorizationContext filterContext) {
            if (filterContext == null)
                throw new ArgumentNullException(nameof(filterContext));

            var httpContext = filterContext.HttpContext;
            var cookie = httpContext.Request.Cookies[AntiForgeryConfig.CookieName];
            AntiForgery.Validate(cookie?.Value, httpContext.Request.Headers["__RequestVerificationToken"]);
        }
    }
}
