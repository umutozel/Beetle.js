using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Specialized;
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
        /// <param name="queryParams">The query parameters.</param>
        /// <param name="actionArgs">The action arguments.</param>
        /// <param name="config">The beetle configuration.</param>
        /// <param name="request">The request.</param>
        /// <param name="actionParameters">The action parameters.</param>
        /// <param name="parameters">The parameters.</param>
        /// <exception cref="BeetleException">Action must have only one parameter (JsonObject, object or dynamic) to be able called with POST.</exception>
        internal static void GetParameters(out NameValueCollection queryParams, out object[] actionArgs,
                                           BeetleConfig config = null, HttpRequest request = null,
                                           ParameterDescriptor[] actionParameters = null, IDictionary<string, object> parameters = null) {
            if (config == null)
                config = BeetleConfig.Instance;
            if (request == null)
                request = HttpContext.Current.Request;

            if (request.HttpMethod == "POST") {
                // supported methods can only have one parameter 
                // (MVC behavior for beetle must be same as WebApi and WebApi cannot have more than one parameters for POST)
                if (actionParameters == null || actionParameters.Length <= 1) {
                    var hasPrm = actionParameters != null && actionParameters.Length == 1;
                    object actionArg = null;
                    // read post data
                    request.InputStream.Position = 0;
                    var postData = new StreamReader(request.InputStream).ReadToEnd();
                    if (request.ContentType.Contains("application/json")) {
                        if (hasPrm)
                            actionArg = JsonConvert.DeserializeObject(postData, config.JsonSerializerSettings) as JObject;
                        // but now there is no query string parameters, we must populate them manually for beetle queries
                        // otherwise beetle cannot use query parameters when using post method
                        var d = JsonConvert.DeserializeObject<Dictionary<string, dynamic>>(postData);
                        queryParams = new NameValueCollection();
                        foreach (var i in d)
                            queryParams.Add(i.Key, i.Value == null ? string.Empty : i.Value.ToString());
                    }
                    else {
                        var prms = HttpContext.Current.Request.Params;
                        queryParams = prms;
                        var d = prms.AllKeys.ToDictionary(k => k, k => prms[k]);
                        if (hasPrm) {
                            var jsonStr = _javaScriptSerializer.Value.Serialize(d);
                            actionArg = JsonConvert.DeserializeObject(jsonStr, config.JsonSerializerSettings);
                        }
                    }
                    actionArgs = hasPrm ? new[] { actionArg } : new object[0];
                }
                else {
                    queryParams = null;
                    actionArgs = null;
                }
            }
            else {
                queryParams = request.QueryString;
                if (actionParameters != null && parameters != null) {
                    actionArgs = actionParameters
                        .Select(pd => parameters[pd.ParameterName])
                        .ToArray();
                }
                else
                    actionArgs = null;
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
            // get beetle query parameters (supported parameters by default)
            var beetlePrms = Server.Helper.GetBeetleParameters(actionContext.QueryParameters);
            var contextHandler = service == null ? null : service.ContextHandler;
            // allow context handler to process the value
            if (contextHandler != null)
                return contextHandler.ProcessRequest(contentValue, beetlePrms, actionContext, service);

            var queryable = contentValue as IQueryable;
            if (queryable != null)
                return QueryableHandler.Instance.HandleContent(queryable, beetlePrms, actionContext, service);

            var enumerable = contentValue as IEnumerable;
            if (enumerable != null)
                return EnumerableHandler.Instance.HandleContent(enumerable, beetlePrms, actionContext, service);

            return new ProcessResult(actionContext) { Result = contentValue };
        }

        /// <summary>
        /// Handles the response.
        /// </summary>
        /// <param name="processResult">The process result.</param>
        /// <param name="config">The configuration.</param>
        /// <param name="response">The response.</param>
        /// <returns></returns>
        internal static ActionResult HandleResponse(ProcessResult processResult, BeetleConfig config = null, HttpResponse response = null) {
            if (config == null)
                config = BeetleConfig.Instance;
            if (response == null)
                response = HttpContext.Current.Response;

            // set InlineCount header info if exists
            object inlineCount = processResult.InlineCount;
            if (inlineCount != null && response.Headers["X-InlineCount"] == null)
                response.Headers.Add("X-InlineCount", inlineCount.ToString());
            if (processResult.UserData != null && response.Headers["X-UserData"] == null)
                response.Headers.Add("X-UserData", processResult.UserData);

            // write the result to response content
            return new BeetleJsonResult(config, processResult) {
                Data = processResult.Result,
                ContentEncoding = response.HeaderEncoding,
                ContentType = "application/json",
                JsonRequestBehavior = JsonRequestBehavior.AllowGet
            };
        }
    }
}
