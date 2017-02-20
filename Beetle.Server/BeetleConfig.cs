using System;
using System.Runtime.Serialization.Formatters;
using Newtonsoft.Json;
using Beetle.Server.Json;
using System.Linq;
using System.Collections;

namespace Beetle.Server {

    public class BeetleConfig {
        private static readonly Lazy<BeetleConfig> _instance = new Lazy<BeetleConfig>();
        private static BeetleConfig _defaultInstance;
        private readonly JsonSerializerSettings _settings;

        public BeetleConfig(): this(CreateSettings()) {
        }

        public BeetleConfig(NullValueHandling nullValueHandling = NullValueHandling.Ignore,
                            TypeNameHandling typeNameHandling = TypeNameHandling.Objects,
                            PreserveReferencesHandling preserveReferencesHandling = PreserveReferencesHandling.Objects,
                            Formatting formatting = Formatting.Indented,
                            DateTimeZoneHandling dateTimeZoneHandling = DateTimeZoneHandling.Local)
            : this(CreateSettings(nullValueHandling, typeNameHandling, preserveReferencesHandling, formatting)) {
        }

        public BeetleConfig(JsonSerializerSettings jsonSerializerSettings) {
            _settings = jsonSerializerSettings;
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
                TypeNameAssemblyFormat = FormatterAssemblyStyle.Simple,
                Formatting = formatting,
                DateTimeZoneHandling = DateTimeZoneHandling.Local
            };

            jsonSerializerSettings.Converters.Add(new BeetleDateTimeConverter { DateTimeFormat = "yyyy-MM-dd\\THH:mm:ss.fffK" });
            jsonSerializerSettings.Converters.Add(new TimeSpanConverter());
            jsonSerializerSettings.Converters.Add(new ByteArrayConverter());
            jsonSerializerSettings.Converters.Add(new DbGeometryConverter());
            jsonSerializerSettings.Converters.Add(new DbGeographyConverter());
            return jsonSerializerSettings;
        }

        public static BeetleConfig Instance {
            get { return _defaultInstance ?? _instance.Value; }
            set { _defaultInstance = value; }
        }

        public virtual JsonSerializer CreateSerializer() {
            return JsonSerializer.Create(JsonSerializerSettings);
        }

        public JsonSerializerSettings JsonSerializerSettings {
            get { return _settings; }
        }

        /// <summary>
        /// Exclusive query handler instance.
        /// </summary>
        public IQueryHandler<IQueryable> QueryableHandler { get; set; }

        /// <summary>
        /// Exclusive enumerable handler instance.
        /// </summary>
        public IContentHandler<IEnumerable> EnumerableHandler { get; set; }
    }
}
