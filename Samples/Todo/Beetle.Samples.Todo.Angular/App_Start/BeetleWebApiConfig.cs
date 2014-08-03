using System.Web.Http;
using Beetle.Samples.Todo.Angular;

[assembly: WebActivatorEx.PreApplicationStartMethod(
    typeof(BeetleWebApiConfig), "RegisterBeetlePreStart")]

namespace Beetle.Samples.Todo.Angular {

    /// <summary>
    /// Beetle web api configuration
    /// </summary>
    public static class BeetleWebApiConfig {

        /// <summary>
        /// Registers the beetle pre start.
        /// </summary>
        public static void RegisterBeetlePreStart() {
            GlobalConfiguration.Configuration.Routes.MapHttpRoute("BeetleApi", "beetle/{controller}/{action}");
        }
    }
}