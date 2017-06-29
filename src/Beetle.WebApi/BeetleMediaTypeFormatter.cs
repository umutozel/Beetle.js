using System;
using System.Collections;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Formatting;
using System.Threading.Tasks;

namespace Beetle.WebApi {

    public class BeetleMediaTypeFormatter : JsonMediaTypeFormatter {

        public override async Task WriteToStreamAsync(Type type, object value, Stream writeStream, HttpContent content, TransportContext transportContext) {
            if (!(value is string) && value is IEnumerable) {
                using (var sw = new StreamWriter(writeStream)) {
                    sw.Write("{\"$d\":");
                    sw.Flush();
                    await base.WriteToStreamAsync(type, value, writeStream, content, transportContext);
                    sw.Write("}");
                }
            }
            else
                await base.WriteToStreamAsync(type, value, writeStream, content, transportContext);
        }
    }
}
