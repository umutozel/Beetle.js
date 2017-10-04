using System.Collections.Generic;
using System.Collections.Specialized;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Beetle.Mvc {
    using Server;
    using Server.Interface;

    public static class Helper {

        public static void GetParameters(IBeetleConfig config, out IList<BeetleParameter> parameters, out dynamic postData) {
            if (config == null) {
                config = BeetleConfig.Instance;
            }
            var request = HttpContext.Current.Request;

            var queryParams = request.QueryString.ToDictionary();

            postData = null;
            if (request.ContentLength > 0) {
                request.InputStream.Position = 0;
                var body = new StreamReader(request.InputStream).ReadToEnd();
                postData = config.Serializer.DeserializeToDynamic(body);
                if (postData != null) {
                    foreach (var p in TypeDescriptor.GetProperties(postData)) {
                        var v = postData[p.Name];
                        queryParams.Add(p.Name, v == null ? string.Empty : v.ToString());
                    }
                }
            }

            parameters = Server.Helper.GetBeetleParameters(queryParams);
        }

        public static void SetCustomHeaders(ProcessResult processResult) {
            var response = HttpContext.Current.Response;

            // set InlineCount header info if exists
            var inlineCount = processResult.InlineCount;
            if (inlineCount != null && response.Headers["X-InlineCount"] == null) {
                response.Headers.Add("X-InlineCount", inlineCount.ToString());
            }

            var userData = processResult.UserData;
            if (userData == null || response.Headers["X-UserData"] != null) return;

            var actionContext = processResult.ActionContext;
            var service = actionContext.Service;
            var config = actionContext.Config ?? service?.Config ?? BeetleConfig.Instance;
            var userDataStr = (config ?? BeetleConfig.Instance).Serializer.Serialize(userData);
            response.Headers.Add("X-UserData", userDataStr);
        }

        public static ActionResult HandleResponse(ProcessResult processResult) {
            var result = processResult.Result;
            var actionContext = processResult.ActionContext;
            var service = actionContext.Service;
            var config = actionContext.Config ?? service?.Config ?? BeetleConfig.Instance;
            var response = HttpContext.Current.Response;

            // write the result to response content
            return new BeetleJsonResult(config, processResult) {
                Data = result,
                ContentEncoding = response.HeaderEncoding,
                ContentType = config.Serializer.ContentType,
                JsonRequestBehavior = JsonRequestBehavior.AllowGet
            };
        }

        public static IDictionary<string, string> ToDictionary(this NameValueCollection nameValueCollection) {
            return nameValueCollection.AllKeys.ToDictionary(k => k, k => nameValueCollection[k]);
        }
    }
}
