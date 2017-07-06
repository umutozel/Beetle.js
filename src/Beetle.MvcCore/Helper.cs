using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Formatters;

namespace Beetle.MvcCore {
    using Server;
    using Server.Interface;

    public static class Helper {

        public static void GetParameters(IBeetleConfig config, HttpRequest request,
                                         out string queryString, out IList<BeetleParameter> parameters) {
            if (config == null) {
                config = BeetleConfig.Instance;
            }

            var queryParams = request.Query.ToDictionary(k => k.Key, k => k.Value.ToString());
            if (request.Method == "POST") {
                request.Body.Position = 0;
                queryString = new StreamReader(request.Body).ReadToEnd();
                queryParams = request.Query.ToDictionary(k => k.Key, k => k.Value.ToString());
                var d = config.Serializer.Deserialize<Dictionary<string, dynamic>>(queryString);
                foreach (var i in d) {
                    queryParams[i.Key] = i.Value.ToString();
                }
            }
            else {
                queryString = request.QueryString.Value;
            }
            parameters = Server.Helper.GetBeetleParameters(queryParams);
        }

        public static void SetCustomHeaders(ProcessResult processResult, HttpResponse response) {
            var actionContext = processResult.ActionContext;
            var service = actionContext.Service;
            var config = actionContext.Config ?? service?.Config ?? BeetleConfig.Instance;

            // set InlineCount header info if exists
            var inlineCount = processResult.InlineCount;
            if (inlineCount != null && !response.Headers.ContainsKey("X-InlineCount")) {
                response.Headers.Add("X-InlineCount", inlineCount.ToString());
            }

            var userData = processResult.UserData;
            if (userData != null && !response.Headers.ContainsKey("X-UserData")) {
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

            //todo: handle response
            return new ObjectResult(result) {
                Formatters = formatterCollection,
                ContentTypes = new MediaTypeCollection { "application/json; charset=utf-8" }
            };
        }

        public static void CheckRequestHash(string queryString, HttpRequest request) {
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
    }
}
