using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Beetle.Mvc {
    using Server;
    using Server.Interface;

    public static class Helper {

        public static void GetParameters(IBeetleConfig config, out string queryString,
                                         out IList<BeetleParameter> parameters) {
            if (config == null) {
                config = BeetleConfig.Instance;
            }
            var request = HttpContext.Current.Request;

            IDictionary<string, string> queryParams;
            if (request.HttpMethod == "POST") {
                request.InputStream.Position = 0;
                queryString = new StreamReader(request.InputStream).ReadToEnd();
                queryParams = request.Params.ToDictionary();
                if (request.ContentType.Contains("application/json")) {
                    var d = config.Serializer.Deserialize<Dictionary<string, dynamic>>(queryString);
                    foreach (var i in d) {
                        queryParams.Add(i.Key, i.Value.ToString());
                    }
                }
            }
            else {
                queryString = HttpUtility.UrlDecode(request.Url.Query);
                queryParams = request.QueryString.ToDictionary();
            }
            parameters = Server.Helper.GetBeetleParameters(queryParams);
        }

        public static void SetCustomHeaders(ProcessResult processResult) {
            var actionContext = processResult.ActionContext;
            var service = actionContext.Service;
            var config = actionContext.Config ?? service?.Config ?? BeetleConfig.Instance;
            var response = HttpContext.Current.Response;

            // set InlineCount header info if exists
            var inlineCount = processResult.InlineCount;
            if (inlineCount != null && response.Headers["X-InlineCount"] == null) {
                response.Headers.Add("X-InlineCount", inlineCount.ToString());
            }

            var userData = processResult.UserData;
            if (userData != null && response.Headers["X-UserData"] == null) {
                var userDataStr = (config ?? BeetleConfig.Instance).Serializer.Serialize(userData);
                response.Headers.Add("X-UserData", userDataStr);
            }
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
                ContentType = "application/json",
                JsonRequestBehavior = JsonRequestBehavior.AllowGet
            };
        }

        public static void CheckRequestHash(string queryString) {
            var request = HttpContext.Current.Request;

            var clientHash = request.Headers["x-beetle-request"];
            if (!string.IsNullOrEmpty(clientHash)) {
                var hashLenStr = request.Headers["x-beetle-request-len"];
                if (!string.IsNullOrEmpty(hashLenStr)) {
                    var queryLen = Convert.ToInt32(hashLenStr);
                    queryString = queryString.Substring(0, queryLen);
                    var serverHash = Meta.Helper.CreateQueryHash(queryString).ToString(CultureInfo.InvariantCulture);

                    if (serverHash == clientHash) return;
                }
            }

            throw new BeetleException(Server.Properties.Resources.AlteredRequestException);
        }

        public static IDictionary<string, string> ToDictionary(this NameValueCollection nameValueCollection) {
            return nameValueCollection.AllKeys.ToDictionary(k => k, k => nameValueCollection[k]);
        }
    }
}
