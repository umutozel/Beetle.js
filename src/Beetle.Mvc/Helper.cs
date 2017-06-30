using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Beetle.Mvc {
    using Server;
    using Server.Interface;

    public static class Helper {

        public static void GetParameters(IBeetleConfig config, out string queryString, out IDictionary<string, string> queryParams) {
            if (config == null) {
                config = BeetleConfig.Instance;
            }
            var request = HttpContext.Current.Request;
            if (request.HttpMethod == "POST") {
                // read post data
                request.InputStream.Position = 0;
                queryString = new StreamReader(request.InputStream).ReadToEnd();
                if (request.ContentType.Contains("application/json")) {
                    var d = config.Serializer.DeserializeToDynamic(queryString);
                    // now there is no query string parameters, we must populate them manually for beetle queries
                    // otherwise beetle cannot use query parameters when using post method
                    queryParams = new Dictionary<string, string>();
                    if (d != null) {
                        foreach (var p in TypeDescriptor.GetProperties(d)) {
                            var v = d[p.Name];
                            queryParams.Add(p.Name, v == null ? string.Empty : v.ToString());
                        }
                    }
                }
                else {
                    var prms = request.Params;
                    var d = prms.AllKeys.ToDictionary(k => k, k => prms[k]);
                    queryParams = d;
                }
            }
            else {
                queryString = request.Url.Query;
                if (queryString.StartsWith("?")) {
                    queryString = queryString.Substring(1);
                }
                queryString = queryString.Replace(":", "%3A");
                queryParams = request.QueryString.AllKeys.ToDictionary(k => k, k => request.QueryString[k]);
            }
        }

        public static ProcessResult ProcessRequest(ActionContext actionContext) {
            // beetle should be used for all content types except mvc actions results. so we check only if content is not an mvc action result
            var service = actionContext.Service;
            if (!string.IsNullOrEmpty(actionContext.QueryString)) {
                bool checkHash;
                if (!actionContext.CheckRequestHash.HasValue)
                    checkHash = service != null && service.CheckRequestHash;
                else
                    checkHash = actionContext.CheckRequestHash.Value;

                if (checkHash)
                    CheckRequestHash(actionContext.QueryString);
            }

            var contextHandler = service?.ContextHandler;
            // allow context handler to process the value
            return contextHandler != null 
                ? contextHandler.ProcessRequest(actionContext) 
                : Server.Helper.DefaultRequestProcessor(actionContext);
        }

        public static ActionResult HandleResponse(ProcessResult processResult) {
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

            if (result is ActionResult actionResult) return actionResult;

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

                    if (serverHash == clientHash)
                        return;
                }
            }

            throw new BeetleException(Server.Properties.Resources.AlteredRequestException);
        }
    }
}
