using System.Web.Mvc;

namespace Beetle.Samples.Todo.Knockout {

    public class FilterConfig {

        public static void RegisterGlobalFilters(GlobalFilterCollection filters) {
            filters.Add(new HandleErrorAttribute());
        }
    }
}