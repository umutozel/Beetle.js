using System;
using System.Globalization;
using Beetle.Server.WebApi.Properties;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Web;
using Newtonsoft.Json;

namespace Beetle.Server.WebApi {

    public static class Helper {

        public static NameValueCollection GetParameters(out string queryString, HttpRequest request = null) {
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
                    if (d != null) {
                        foreach (var i in d)
                            queryParams.Add(i.Key, i.Value.ToString());
                    }
                    return queryParams;
                }
                return request.Params;
            }

            queryString = request.Url.Query;
            if (queryString.StartsWith("?"))
                queryString = queryString.Substring(1);
            queryString = queryString.Replace(":", "%3A");

            return request.QueryString;
        }

        public static ProcessResult ProcessRequest(object contentValue, ActionContext actionContext, HttpRequestMessage request,
                                                   bool forbidBeetleQueryParams = false, BeetleConfig actionConfig = null, IBeetleService service = null) {
            if (!string.IsNullOrEmpty(actionContext.QueryString)) {
                bool checkHash;
                if (!actionContext.CheckRequestHash.HasValue)
                    checkHash = service != null && service.CheckRequestHash;
                else
                    checkHash = actionContext.CheckRequestHash.Value;

                if (checkHash)
                    CheckRequestHash(actionContext.QueryString);
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
                ? contextHandler.ProcessRequest(contentValue, beetlePrms, actionContext, actionConfig, service) 
                : Server.Helper.DefaultRequestProcessor(contentValue, beetlePrms, actionContext, service, null, actionConfig);

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

        public static ObjectContent HandleResponse(ProcessResult processResult, BeetleConfig config = null, HttpResponse response = null) {
            if (config == null)
                config = BeetleConfig.Instance;
            if (response == null)
                response = HttpContext.Current.Response;

            var type = processResult.Result == null
                ? typeof(object)
                : processResult.Result.GetType();

            var formatter = new BeetleMediaTypeFormatter { SerializerSettings = config.JsonSerializerSettings };
            formatter.SupportedMediaTypes.Add(new MediaTypeHeaderValue("application/json"));
            formatter.SupportedEncodings.Add(new UTF8Encoding(false, true));
            var retVal = new ObjectContent(type, processResult.Result, formatter);

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

        public static void CheckRequestHash(string queryString) {
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
