using System.Web.Http;

[assembly: WebActivatorEx.PreApplicationStartMethod(typeof(Beetle.Client.App_Start.BeetleWebApiConfig), "RegisterBeetlePreStart")]

namespace Beetle.Client.App_Start {

    /// <summary>
    /// Beetle web api configuration
    /// </summary>
    public static class BeetleWebApiConfig {

        /// <summary>
        /// Registers the beetle pre start.
        /// </summary>
        public static void RegisterBeetlePreStart() {
            GlobalConfiguration.Configuration.Routes.MapHttpRoute("BeetleApi", "api/{controller}/{action}");
        }
    }
}