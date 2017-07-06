using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Formatters;

namespace Beetle.MvcCore {
    using Server.Interface;

    public class BeetleMediaTypeFormatter : OutputFormatter {
        private readonly IBeetleConfig _config;

        public BeetleMediaTypeFormatter(IBeetleConfig config) {
            _config = config;
        }

        public override Task WriteResponseBodyAsync(OutputFormatterWriteContext context) {
            var response = context.HttpContext.Response;

            var content = _config.Serializer.Serialize(context.Object);
            return response.WriteAsync(content);
        }
    }
}
