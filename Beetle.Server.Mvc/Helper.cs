using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Script.Serialization;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Beetle.Server.Mvc {

    /// <summary>
    /// Common helper methods for WebApi.
    /// </summary>
    internal static class Helper {
        private static readonly Lazy<JavaScriptSerializer> _javaScriptSerializer = new Lazy<JavaScriptSerializer>();

        /// <summary>
        /// Handles the request.
        /// </summary>
        /// <param name="queryString">The query string.</param>
        /// <param name="queryParams">The query parameters.</param>
        /// <param name="config">The beetle configuration.</param>
        /// <param name="parameterDescriptors">The action parameter descriptors.</param>
        /// <param name="parameters">The action parameters.</param>
        /// <param name="request">The request.</param>
        /// <exception cref="BeetleException">Action must have only one parameter (JsonObject, object or dynamic) to be able called with POST.</exception>
        internal static void GetParameters(out string queryString, out NameValueCollection queryParams,
                                           BeetleConfig config = null, 
                                           ParameterDescriptor[] parameterDescriptors = null, IDictionary<string, object> parameters = null,
                                           HttpRequest request = null) {
            if (config == null)
                config = BeetleConfig.Instance;
            if (request == null)
                request = HttpContext.Current.Request;

            if (request.HttpMethod == "POST") {
                object postData;
                // read post data
                request.InputStream.Position = 0;
                queryString = new StreamReader(request.InputStream).ReadToEnd();
                if (request.ContentType.Contains("application/json")) {
                    postData = JsonConvert.DeserializeObject<JObject>(queryString, config.JsonSerializerSettings);
                    // now there is no query string parameters, we must populate them manually for beetle queries
                    // otherwise beetle cannot use query parameters when using post method
                    var d = JsonConvert.DeserializeObject<Dictionary<string, dynamic>>(queryString);
                    queryParams = new NameValueCollection();
                    foreach (var i in d)
                        queryParams.Add(i.Key, i.Value == null ? string.Empty : i.Value.ToString());
                }
                else {
                    var prms = request.Params;
                    queryParams = prms;
                    var d = prms.AllKeys.ToDictionary(k => k, k => prms[k]);
                    var jsonStr = _javaScriptSerializer.Value.Serialize(d);
                    postData = JsonConvert.DeserializeObject<JObject>(jsonStr, config.JsonSerializerSettings);
                }

                // modify the action parameters to allow model binding to object, dynamic and json.net parameters 
                if (parameterDescriptors != null && parameters != null) {
                    foreach (var parameterDescriptor in parameterDescriptors) {
                        var t = parameterDescriptor.ParameterType;
                        if (t.IsAssignableFrom(typeof(object)) || typeof(JToken).IsAssignableFrom(t)) {
                            parameters[parameterDescriptor.ParameterName] = postData;
                        }
                    }
                }
            }
            else {
                queryString = request.Url.Query;
                if (queryString.StartsWith("?"))
                    queryString = queryString.Substring(1);
                queryString = queryString.Replace(":", "%3A");

                queryParams = request.QueryString;
            }
        }

        /// <summary>
        /// Processes the IQueryable.
        /// </summary>
        /// <param name="contentValue">The content value.</param>
        /// <param name="actionContext">The action context.</param>
        /// <param name="service">The service.</param>
        /// <returns></returns>
        /// <exception cref="BeetleException">Beetle query strings are not allowed.</exception>
        internal static ProcessResult ProcessRequest(object contentValue, ActionContext actionContext, IBeetleService service = null) {
            // beetle should be used for all content types except mvc actions results. so we check only if content is not an mvc action result
            if (!(contentValue is ActionResult) && !string.IsNullOrEmpty(actionContext.QueryString)) {
                bool checkHash;
                if (!actionContext.CheckRequestHash.HasValue)
                    checkHash = service != null && service.CheckRequestHash;
                else
                    checkHash = actionContext.CheckRequestHash.Value;

                if (checkHash)
                    CheckRequestHash(actionContext.QueryString);
            }

            // get beetle query parameters (supported parameters by default)
            var beetlePrms = Server.Helper.GetBeetleParameters(actionContext.QueryParameters);

            var contextHandler = service == null ? null : service.ContextHandler;
            // allow context handler to process the value
            if (contextHandler != null)
                return contextHandler.ProcessRequest(contentValue, beetlePrms, actionContext, service);

            return Server.Helper.DefaultRequestProcessor(contentValue, beetlePrms, actionContext, service);
        }

        /// <summary>
        /// Handles the response.
        /// </summary>
        /// <param name="processResult">The process result.</param>
        /// <param name="config">The configuration.</param>
        /// <param name="response">The response.</param>
        /// <returns></returns>
        internal static ActionResult HandleResponse(ProcessResult processResult, BeetleConfig config = null, HttpResponse response = null) {
            var result = processResult.Result;

            if (config == null)
                config = BeetleConfig.Instance;
            if (response == null)
                response = HttpContext.Current.Response;

            // set InlineCount header info if exists
            object inlineCount = processResult.InlineCount;
            if (inlineCount != null && response.Headers["X-InlineCount"] == null)
                response.Headers.Add("X-InlineCount", inlineCount.ToString());
            if (processResult.UserData != null && response.Headers["X-UserData"] == null) {
                var userDataStr = JsonConvert.SerializeObject(processResult.UserData, Formatting.None, config.JsonSerializerSettings);
                response.Headers.Add("X-UserData", userDataStr);
            }

            var actionResult = result as ActionResult;
            if (actionResult != null) return actionResult;

            // write the result to response content
            return new BeetleJsonResult(config, processResult) {
                Data = result,
                ContentEncoding = response.HeaderEncoding,
                ContentType = "application/json",
                JsonRequestBehavior = JsonRequestBehavior.AllowGet
            };
        }

        /// <summary>
        /// Checks the request hash.
        /// </summary>
        /// <param name="queryString">The query string.</param>
        /// <exception cref="BeetleException"></exception>
        internal static void CheckRequestHash(string queryString) {
            var request = HttpContext.Current.Request;

            var clientHash = request.Headers["x-beetle-request"];
            if (!string.IsNullOrEmpty(clientHash)) {
                var hashLenStr = request.Headers["x-beetle-request-len"];
                if (!string.IsNullOrEmpty(hashLenStr)) {
                    var queryLen = Convert.ToInt32(hashLenStr);
                    queryString = queryString.Substring(0, queryLen);
                    var serverHash = Server.Helper.CreateQueryHash(queryString).ToString(CultureInfo.InvariantCulture);

                    if (serverHash == clientHash)
                        return;
                }
            }

            throw new BeetleException(Server.Properties.Resources.AlteredRequestException);
        }
    }
}
