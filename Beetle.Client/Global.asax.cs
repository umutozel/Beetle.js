using System.Collections.Generic;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Routing;
using Beetle.Client.App_Start;

namespace Beetle.Client {
    // Note: For instructions on enabling IIS6 or IIS7 classic mode, 
    // visit http://go.microsoft.com/?LinkId=9394801

    public class WebApiApplication : System.Web.HttpApplication {

        protected void Application_Start() {
            AreaRegistration.RegisterAllAreas();

            WebApiConfig.Register(GlobalConfiguration.Configuration);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);

            //var m = Beetle.Server.Helper.GenerateMetadata(typeof(Customer));
        }
    }

    //public class Customer {
    //    public int Id { get; set; }
    //    public string Name { get; set; }
    //    public ICollection<CustomerDetail> CustomerDetails { get; set; }
    //}

    //public class CustomerDetail {
    //    public int Id { get; set; }
    //    public int CustomerId { get; set; }
    //    public string Address { get; set; }
    //}
}