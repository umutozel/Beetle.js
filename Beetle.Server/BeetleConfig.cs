using System;
using System.Runtime.Serialization.Formatters;
using Newtonsoft.Json;
using Beetle.Server.Json;
using System.Linq;
using System.Collections;

namespace Beetle.Server {

    /// <summary>
    /// Default config implementation using Newtonsoft.
    /// We want Beetle to work without any configuration, so here the default implementation and yeah there is dependency to Newtonsoft.
    /// (Microsoft did it too with their JsonMediaTypeFormatter).
    /// But it is possible to use another serializer via IBeetleService.
    /// </summary>
    public class BeetleConfig: IBeetleConfig {
        private static readonly Lazy<BeetleConfig> _instance = new Lazy<BeetleConfig>();
        private readonly JsonSerializerSettings _settings;
        private readonly NewtonsoftSerializer _serializer;

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
            _serializer = new NewtonsoftSerializer(JsonSerializerSettings);
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
            get { return _instance.Value; }
        }

        public virtual JsonSerializer CreateSerializer() {
            return JsonSerializer.Create(JsonSerializerSettings);
        }

        public JsonSerializerSettings JsonSerializerSettings {
            get { return _settings; }
        }

        public NewtonsoftSerializer Serializer {
            get { return _serializer; }
        }

        public virtual IQueryHandler<IQueryable> QueryableHandler { get; }

        public virtual IContentHandler<IEnumerable> EnumerableHandler { get; }

        ISerializer IBeetleConfig.Serializer {
            get { return Serializer; }
        }
    }

    public interface IBeetleConfig {

        ISerializer Serializer { get; }

        /// <summary>
        /// Exclusive query handler instance.
        /// Will be used even if ContextHandler has one. When not null, we are saying "Use this handler for this config (action) no matter what".
        /// </summary>
        IQueryHandler<IQueryable> QueryableHandler { get; }

        /// <summary>
        /// Exclusive enumerable handler instance.
        /// Will be used even if ContextHandler has one. When not null, we are saying "Use this handler for this config (action) no matter what".
        /// </summary>
        IContentHandler<IEnumerable> EnumerableHandler { get; }
    }
}
