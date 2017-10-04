using System;
using System.Net.Http.Formatting;
using System.Net.Http.Headers;
using Newtonsoft.Json;

namespace Beetle.WebApi {
    using Server;
    using Server.Interface;

    public class BeetleApiConfig: BeetleConfig, IBeetleApiConfig {
        private static readonly Lazy<BeetleApiConfig> _instance = new Lazy<BeetleApiConfig>();

        public BeetleApiConfig() {
        }

        public BeetleApiConfig(NullValueHandling nullValueHandling,
                               TypeNameHandling typeNameHandling = TypeNameHandling.Objects,
                               Formatting formatting = Formatting.Indented,
                               ReferenceLoopHandling referenceLoopHandling = ReferenceLoopHandling.Ignore,
                               PreserveReferencesHandling preserveReferencesHandling = PreserveReferencesHandling.Objects,
                               DateTimeZoneHandling dateTimeZoneHandling = DateTimeZoneHandling.Local)
                : base(nullValueHandling, typeNameHandling, formatting, referenceLoopHandling, 
                       preserveReferencesHandling, dateTimeZoneHandling) {
        }

        public BeetleApiConfig(JsonSerializerSettings jsonSerializerSettings): base(jsonSerializerSettings) {
        }

        public new static BeetleApiConfig Instance => _instance.Value;

        public MediaTypeFormatter CreateFormatter() {
            var formatter = new BeetleMediaTypeFormatter { SerializerSettings = JsonSerializerSettings };
            formatter.SupportedMediaTypes.Add(new MediaTypeHeaderValue(Serializer.ContentType));
            formatter.SupportedEncodings.Add(Serializer.Encoding);
            return formatter;
        }
    }

    public interface IBeetleApiConfig: IBeetleConfig {
        MediaTypeFormatter CreateFormatter();
    }
}
