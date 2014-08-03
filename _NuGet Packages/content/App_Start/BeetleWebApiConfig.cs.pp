using System.Web.Http;

[assembly: WebActivatorEx.PreApplicationStartMethod(typeof($rootnamespace$.App_Start.BeetleWebApiConfig), "RegisterBeetlePreStart")]

namespace $rootnamespace$.App_Start {

    /// <summary>
    /// Beetle web api configuration
    /// </summary>
    public static class BeetleWebApiConfig {

        /// <summary>
        /// Registers the beetle pre start.
        /// </summary>
        public static void RegisterBeetlePreStart() {
            GlobalConfiguration.Configuration.Routes.MapHttpRoute("BeetleApi1", "beetle/{controller}/{action}");
            GlobalConfiguration.Configuration.Routes.MapHttpRoute("BeetleApi2", "api/{controller}/{action}");
        }
    }
}