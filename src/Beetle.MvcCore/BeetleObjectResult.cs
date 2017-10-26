using Microsoft.AspNetCore.Mvc;

#if MVC_CORE_API
namespace Beetle.MvcCoreApi {
#else
namespace Beetle.MvcCore {
#endif

    public class BeetleObjectResult : ObjectResult {
        public BeetleObjectResult(object value) : base(value) { }
    }
}