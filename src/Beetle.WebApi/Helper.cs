using System;
using System.Globalization;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Web;
using System.Net.Http.Formatting;

namespace Beetle.WebApi {
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

        public static ObjectContent HandleResponse(ProcessResult processResult) {
            var result = processResult.Result;

            var actionContext = processResult.ActionContext;
            var service = actionContext.Service;
            var config = actionContext.Config ?? service?.Config ?? BeetleConfig.Instance;
            var response = HttpContext.Current.Response;

            // set InlineCount header info if exists
            object inlineCount = processResult.InlineCount;
            if (inlineCount != null && response.Headers["X-InlineCount"] == null) {
                response.Headers.Add("X-InlineCount", inlineCount.ToString());
            }
            if (processResult.UserData != null && response.Headers["X-UserData"] == null) {
                var userDataStr = config.Serializer.Serialize(processResult.UserData);
                response.Headers.Add("X-UserData", userDataStr);
            }

            var type = result?.GetType() ?? typeof(object);
            var formatter = CreateFormatter(config);
            return new ObjectContent(type, result, formatter);
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

        public static MediaTypeFormatter CreateFormatter(IBeetleConfig config) {
            var beetleConfig = config as BeetleConfig;
            var settings = beetleConfig != null ? beetleConfig.JsonSerializerSettings : BeetleConfig.Instance.JsonSerializerSettings;

            var formatter = new BeetleMediaTypeFormatter { SerializerSettings = settings };
            formatter.SupportedMediaTypes.Add(new MediaTypeHeaderValue("application/json"));
            formatter.SupportedEncodings.Add(new UTF8Encoding(false, true));
            return formatter;
        }
    }
}
