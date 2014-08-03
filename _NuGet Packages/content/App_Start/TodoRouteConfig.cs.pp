using System.Web.Mvc;

[assembly: WebActivatorEx.PreApplicationStartMethod(typeof($rootnamespace$.App_Start.TodoRouteConfig), "RegisterTodoPreStart", Order = 2)]

namespace $rootnamespace$.App_Start {

  ///<summary>
  /// Modify default page
  ///</summary>
  public static class TodoRouteConfig {

    public static void RegisterTodoPreStart() {
      System.Web.Routing.RouteTable.Routes.IgnoreRoute("{resource}.axd/{*pathInfo}");
      System.Web.Routing.RouteTable.Routes.MapRoute(
          name: "BeetleTodo",
          url: "{controller}/{action}/{id}",
          defaults: new {
              controller = "Todo",
              action = "Index",
              id = UrlParameter.Optional
          }
      );
    }
  }
}