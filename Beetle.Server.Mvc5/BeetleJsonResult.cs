using Beetle.Server.Mvc.Properties;
using System;
using System.Collections;
using System.Web.Mvc;
using Newtonsoft.Json;

namespace Beetle.Server.Mvc {

    public class BeetleJsonResult: JsonResult {
        private readonly BeetleConfig _config;
        private readonly ProcessResult _processResult;

        public BeetleJsonResult(BeetleConfig config, ProcessResult processResult) {
            _config = config;
            _processResult = processResult;
        }

        public ProcessResult ProcessResult {
            get { return _processResult; }
        }

        public override void ExecuteResult(ControllerContext context) {
            var response = context.HttpContext.Response;

            if (JsonRequestBehavior == JsonRequestBehavior.DenyGet && context.HttpContext.Request.HttpMethod == "GET")
                throw new InvalidOperationException(Resources.GETRequestNotAllowed);

            response.ContentType = !string.IsNullOrEmpty(ContentType)
                ? ContentType
                : "application/json";

            if (ContentEncoding != null)
                response.ContentEncoding = ContentEncoding;

            var d = JsonConvert.SerializeObject(Data, _config.JsonSerializerSettings);
            if (!(Data is string) && Data is IEnumerable)
                d = "{\"$d\" : " + d + "}";
            response.Write(d);
        }
    }
}
