using System.Collections;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.Net.Http.Headers;

namespace Beetle.MvcCore {
    using Server.Interface;

    public class BeetleMediaTypeFormatter : OutputFormatter {
        private readonly IBeetleConfig _config;

        public BeetleMediaTypeFormatter(IBeetleConfig config) {
            _config = config;

            SupportedMediaTypes.Add(MediaTypeHeaderValue.Parse(config.Serializer.ContentType));
        }

        public override Task WriteResponseBodyAsync(OutputFormatterWriteContext context) {
            var response = context.HttpContext.Response;

            var value = context.Object;

            var d = _config.Serializer.Serialize(value);
            if (!(value is string) && value is IEnumerable) {
                d = "{\"$d\" : " + d + "}";
            }

            return response.WriteAsync(d);
        }
    }
}
