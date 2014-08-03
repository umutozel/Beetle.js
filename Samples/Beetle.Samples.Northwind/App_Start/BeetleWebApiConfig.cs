using System.Web.Http;

[assembly: WebActivatorEx.PreApplicationStartMethod(
    typeof(Beetle.Samples.Northwind.App_Start.BeetleWebApiConfig), "RegisterBeetlePreStart")]
namespace Beetle.Samples.Northwind.App_Start {

    /// <summary>
    /// Beetle web api configuration
    /// </summary>
    public static class BeetleWebApiConfig {

        /// <summary>
        /// Registers the beetle pre start.
        /// </summary>
        public static void RegisterBeetlePreStart() {
            GlobalConfiguration.Configuration.Routes.MapHttpRoute("BeetleApi", "svc/{controller}/{action}");
        }
    }
}