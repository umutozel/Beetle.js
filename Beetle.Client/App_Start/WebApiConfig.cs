using System.Web.Http;

namespace Beetle.Client.App_Start {

    public static class WebApiConfig {

        public static void Register(HttpConfiguration config) {
            config.Routes.MapHttpRoute("BeetleApi", "api/{controller}/{action}/{id}", new { id = RouteParameter.Optional });
        }
    }
}
