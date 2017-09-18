using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Web;

namespace Beetle.WebApi {
    using Server;
    using Server.Interface;

    public static class Helper {

        public static void GetParameters(IBeetleConfig config, out IList<BeetleParameter> parameters) {
            if (config == null) {
                config = BeetleConfig.Instance;
            }
            var request = HttpContext.Current.Request;

            var queryParams = request.QueryString.ToDictionary();

            if (request.ContentLength > 0) {
                request.InputStream.Position = 0;
                var body = new StreamReader(request.InputStream).ReadToEnd();
                var d = config.Serializer.Deserialize<Dictionary<string, dynamic>>(body);
                if (d != null) {
                    foreach (var i in d) {
                        var v = i.Value;
                        queryParams.Add(i.Key, v == null ? string.Empty : v.ToString());
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
            if (userData != null && response.Headers["X-UserData"] == null) {
                var actionContext = processResult.ActionContext;
                var service = actionContext.Service;
                var config = actionContext.Config ?? service?.Config ?? BeetleConfig.Instance;
                var userDataStr = (config ?? BeetleConfig.Instance).Serializer.Serialize(userData);
                response.Headers.Add("X-UserData", userDataStr);
            }
        }

        public static ObjectContent HandleResponse(ProcessResult processResult) {
            var result = processResult.Result;

            var actionContext = processResult.ActionContext;
            var service = actionContext.Service;
            var config = actionContext.Config as IBeetleApiConfig
                ?? service?.Config as IBeetleApiConfig
                ?? BeetleApiConfig.Instance;

            var type = result?.GetType() ?? typeof(object);
            var formatter = config.CreateFormatter();
            return new ObjectContent(type, result, formatter);
        }

        public static IDictionary<string, string> ToDictionary(this NameValueCollection nameValueCollection) {
            return nameValueCollection.AllKeys.ToDictionary(k => k, k => nameValueCollection[k]);
        }
    }
}
