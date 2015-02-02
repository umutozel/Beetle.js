using System;
using System.Globalization;
using Beetle.Server.WebApi.Properties;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Web;
using Newtonsoft.Json;

namespace Beetle.Server.WebApi {

    /// <summary>
    /// Common helper methods for WebApi.
    /// </summary>
    internal static class Helper {

        /// <summary>
        /// Handles the request.
        /// </summary>
        /// <param name="queryString">The query string.</param>
        /// <param name="request">The request.</param>
        /// <returns>
        /// The query parameters.
        /// </returns>
        internal static NameValueCollection GetParameters(out string queryString, HttpRequest request = null) {
            if (request == null)
                request = HttpContext.Current.Request;

            // beetle also supports post http method
            if (request.HttpMethod == "POST") {
                request.InputStream.Position = 0;
                queryString = new StreamReader(request.InputStream).ReadToEnd();
                // we read query options from input stream
                if (request.ContentType.Contains("application/json")) {
                    var d = JsonConvert.DeserializeObject<Dictionary<string, dynamic>>(queryString);
                    var queryParams = new NameValueCollection(request.Params);
                    foreach (var i in d)
                        queryParams.Add(i.Key, i.Value.ToString());
                    return queryParams;
                }
                return request.Params;
            }

            queryString = request.Url.Query;
            return request.QueryString;
        }

        /// <summary>
        /// Processes the IQueryable.
        /// </summary>
        /// <param name="contentValue">The content value.</param>
        /// <param name="actionContext">The action context.</param>
        /// <param name="request">The request.</param>
        /// <param name="forbidBeetleQueryParams">if set to <c>true</c> [forbid beetle query params].</param>
        /// <param name="service">The service.</param>
        /// <returns></returns>
        /// <exception cref="BeetleException">Beetle query strings are not allowed.</exception>
        internal static ProcessResult ProcessRequest(object contentValue, ActionContext actionContext, HttpRequestMessage request,
                                                     bool forbidBeetleQueryParams = false, IBeetleService service = null) {

            // if has OData or Beetle query parameter
            if (actionContext.Value != contentValue || actionContext.QueryParameters.HasKeys()) {
                bool checkHash;
                if (!actionContext.CheckQueryHash.HasValue)
                    checkHash = service != null && service.CheckQueryHash;
                else
                    checkHash = actionContext.CheckQueryHash.Value;

                if (checkHash)
                    CheckQueryHash(actionContext.QueryString);
            }

            var queryParams = actionContext.QueryParameters;
            var inlineCountParam = queryParams["$inlineCount"];
            // get beetle query parameters (supported parameters by default)
            var beetlePrms = Server.Helper.GetBeetleParameters(queryParams);
            if (beetlePrms.Count > 0) {
                if (forbidBeetleQueryParams) throw new BeetleException(Resources.BeetleQueryStringsAreNotAllowed);
                // if inlineCount parameter is given with OData format, add it to beetle parameters to return correct in-line count
                if (!string.IsNullOrWhiteSpace(inlineCountParam))
                    beetlePrms.Add(new KeyValuePair<string, string>("inlineCount", inlineCountParam));
            }

            var contextHandler = service == null ? null : service.ContextHandler;
            // allow context handler to process the value
            var processResult = contextHandler != null 
                ? contextHandler.ProcessRequest(contentValue, beetlePrms, actionContext, service) 
                : Server.Helper.DefaultRequestProcessor(contentValue, beetlePrms, actionContext, service);

            if (processResult.InlineCount == null && inlineCountParam == "allpages") {
                object inlineCount;
                if (!request.Properties.TryGetValue("MS_InlineCount", out inlineCount)) {
                    object inlineCountQueryObj;
                    request.Properties.TryGetValue("BeetleInlineCountQuery", out inlineCountQueryObj);
                    var inlineCountQuery = inlineCountQueryObj as IQueryable;
                    if (inlineCountQuery != null)
                        processResult.InlineCount = Queryable.Count((dynamic)inlineCountQuery);
                }
            }

            return processResult;
        }

        /// <summary>
        /// Handles the response.
        /// </summary>
        /// <param name="processResult">The process result.</param>
        /// <param name="config">The configuration.</param>
        /// <param name="response">The response.</param>
        /// <returns></returns>
        internal static ObjectContent HandleResponse(ProcessResult processResult, BeetleConfig config = null, HttpResponse response = null) {
            if (config == null)
                config = BeetleConfig.Instance;
            if (response == null)
                response = HttpContext.Current.Response;

            var type = processResult.Result == null
                ? typeof(object)
                : processResult.Result.GetType();
            var retVal = new ObjectContent(type, processResult.Result, config.MediaTypeFormatter);

            // set InlineCount header info if exists
            object inlineCount = processResult.InlineCount;
            if (inlineCount != null && response.Headers["X-InlineCount"] == null)
                response.Headers["X-InlineCount"] = inlineCount.ToString();
            if (processResult.UserData != null && response.Headers["X-UserData"] == null) {
                var userDataStr = JsonConvert.SerializeObject(processResult.UserData, config.JsonSerializerSettings);
                response.Headers["X-UserData"] = userDataStr;
            }

            return retVal;
        }

        /// <summary>
        /// Checks the query hash.
        /// </summary>
        internal static void CheckQueryHash(string queryString) {
            var request = HttpContext.Current.Request;

            var clientHash = request.Headers["x-beetle-query"];
            if (queryString.Length > 0)
                queryString = queryString.Substring(1);

            if (!string.IsNullOrEmpty(clientHash)) {
                var hashLenStr = request.Headers["x-beetle-query-len"];
                if (!string.IsNullOrEmpty(hashLenStr)) {
                    var queryLen = Convert.ToInt32(hashLenStr);
                    queryString = queryString.Substring(0, queryLen);
                    var serverHash = Server.Helper.CreateQueryHash(queryString).ToString(CultureInfo.InvariantCulture);

                    if (serverHash == clientHash)
                        return;
                }
            }
            throw new BeetleException(Server.Properties.Resources.AlteredQueryException);
        }
    }
}
