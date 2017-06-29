using System;
using Newtonsoft.Json;
using System.Linq;
using System.Collections;

namespace Beetle.Server {
    using Interface;
    using Json;

    /// <summary>
    /// Default config implementation using Newtonsoft.
    /// We want Beetle to work without any configuration, so here the default implementation and yeah there is dependency to Newtonsoft.
    /// (Microsoft did it too with their JsonMediaTypeFormatter).
    /// But it is possible to use another serializer.
    /// </summary>
    public class BeetleConfig: IBeetleConfig {
        private static readonly Lazy<BeetleConfig> _instance = new Lazy<BeetleConfig>();

        public BeetleConfig(NullValueHandling nullValueHandling = NullValueHandling.Ignore,
                            TypeNameHandling typeNameHandling = TypeNameHandling.Objects,
                            PreserveReferencesHandling preserveReferencesHandling = PreserveReferencesHandling.Objects,
                            Formatting formatting = Formatting.Indented,
                            DateTimeZoneHandling dateTimeZoneHandling = DateTimeZoneHandling.Local)
            : this(CreateSettings(nullValueHandling, typeNameHandling, preserveReferencesHandling, formatting, dateTimeZoneHandling)) {
        }

        public BeetleConfig(JsonSerializerSettings jsonSerializerSettings) {
            JsonSerializerSettings = jsonSerializerSettings;
            Serializer = new NewtonsoftSerializer(JsonSerializerSettings);
        }

        private static JsonSerializerSettings CreateSettings(NullValueHandling nullValueHandling = NullValueHandling.Ignore,
                                                             TypeNameHandling typeNameHandling = TypeNameHandling.Objects,
                                                             PreserveReferencesHandling preserveReferencesHandling = PreserveReferencesHandling.Objects,
                                                             Formatting formatting = Formatting.Indented,
                                                             DateTimeZoneHandling dateTimeZoneHandling = DateTimeZoneHandling.Local) {
            var jsonSerializerSettings = new JsonSerializerSettings {
                NullValueHandling = nullValueHandling,
                PreserveReferencesHandling = preserveReferencesHandling,
                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                TypeNameHandling = typeNameHandling,
                TypeNameAssemblyFormatHandling = TypeNameAssemblyFormatHandling.Simple,
                Formatting = formatting,
                DateTimeZoneHandling = dateTimeZoneHandling
            };

            jsonSerializerSettings.Converters.Add(new BeetleDateTimeConverter { DateTimeFormat = "yyyy-MM-dd\\THH:mm:ss.fffK" });
            jsonSerializerSettings.Converters.Add(new TimeSpanConverter());
            jsonSerializerSettings.Converters.Add(new ByteArrayConverter());
            return jsonSerializerSettings;
        }

        public static BeetleConfig Instance => _instance.Value;

        public virtual JsonSerializer CreateSerializer() {
            return JsonSerializer.Create(JsonSerializerSettings);
        }

        public JsonSerializerSettings JsonSerializerSettings { get; }

        public NewtonsoftSerializer Serializer { get; }

        public virtual IQueryHandler<IQueryable> QueryableHandler { get; } = null;

        public virtual IContentHandler<IEnumerable> EnumerableHandler { get; } = null;

        ISerializer IBeetleConfig.Serializer => Serializer;
    }
}
