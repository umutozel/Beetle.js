using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Formatters;

#if MVC_CORE_API
namespace Beetle.MvcCoreApi {
#else
namespace Beetle.MvcCore {
#endif
    using Server;
    using Server.Interface;

    public static class Helper {

        public static void GetParameters(IBeetleConfig config, HttpRequest request, out IList<BeetleParameter> parameters) {
            if (config == null) {
                config = BeetleConfig.Instance;
            }

            var queryParams = request.Query.ToDictionary(k => k.Key, k => k.Value.ToString());
            if (request.ContentLength > 0) {
                if (request.Body.CanSeek) {
                    request.Body.Position = 0;
                }

                var body = new StreamReader(request.Body).ReadToEnd();
                var d = config.Serializer.Deserialize<Dictionary<string, dynamic>>(body);
                if (d != null) {
                    foreach (var i in d) {
                        var v = i.Value;
                        queryParams[i.Key] = v == null ? string.Empty : v.ToString();
                    }
                }
            }

            parameters = Server.Helper.GetBeetleParameters(queryParams);
        }

        public static void SetCustomHeaders(ProcessResult processResult, HttpResponse response) {
            // set InlineCount header info if exists
            var inlineCount = processResult.InlineCount;
            if (inlineCount != null && !response.Headers.ContainsKey("X-InlineCount")) {
                response.Headers.Add("X-InlineCount", inlineCount.ToString());
            }

            var userData = processResult.UserData;
            if (userData != null && !response.Headers.ContainsKey("X-UserData")) {
                var actionContext = processResult.ActionContext;
                var service = actionContext.Service;
                var config = actionContext.Config ?? service?.Config ?? BeetleConfig.Instance;
                var userDataStr = (config ?? BeetleConfig.Instance).Serializer.Serialize(userData);
                response.Headers.Add("X-UserData", userDataStr);
            }
        }

        public static ActionResult HandleResponse(ProcessResult processResult, HttpResponse response) {
            var result = processResult.Result;
            var actionContext = processResult.ActionContext;
            var service = actionContext.Service;
            var config = actionContext.Config ?? service?.Config ?? BeetleConfig.Instance;
            var formatter = new BeetleMediaTypeFormatter(config);
            var formatters = new List<IOutputFormatter> { formatter };
            var formatterCollection = new FormatterCollection<IOutputFormatter>(formatters);

            return new ObjectResult(result) {
                Formatters = formatterCollection,
                ContentTypes = new MediaTypeCollection { config.Serializer.ContentType }
            };
        }
    }
}
