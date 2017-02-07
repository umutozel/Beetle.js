using System;
using System.Runtime.Serialization.Formatters;
using Newtonsoft.Json;
using Beetle.Server.Json;

namespace Beetle.Server {

    /// <summary>
    /// Beetle configuration.
    /// </summary>
    public class BeetleConfig {
        private static readonly Lazy<BeetleConfig> _instance = new Lazy<BeetleConfig>();
        private static BeetleConfig _defaultInstance;
        private readonly JsonSerializerSettings _settings;

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleConfig" /> class.
        /// </summary>
        public BeetleConfig(): this(CreateSettings()) {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleConfig" /> class.
        /// </summary>
        /// <param name="nullValueHandling">The null value handling.</param>
        /// <param name="typeNameHandling">The type name handling.</param>
        /// <param name="preserveReferencesHandling">The reference handling, uses $id.</param>
        /// <param name="formatting">The reference handling, uses $id.</param>
        public BeetleConfig(NullValueHandling nullValueHandling = NullValueHandling.Ignore,
                            TypeNameHandling typeNameHandling = TypeNameHandling.Objects,
                            PreserveReferencesHandling preserveReferencesHandling = PreserveReferencesHandling.Objects,
                            Formatting formatting = Formatting.Indented,
                            DateTimeZoneHandling dateTimeZoneHandling = DateTimeZoneHandling.Local)
            : this(CreateSettings(nullValueHandling, typeNameHandling, preserveReferencesHandling, formatting)) {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleConfig" /> class.
        /// </summary>
        /// <param name="jsonSerializerSettings">The json serializer settings.</param>
        public BeetleConfig(JsonSerializerSettings jsonSerializerSettings) {
            _settings = jsonSerializerSettings;
        }

        /// <summary>
        /// Creates the settings instance.
        /// </summary>
        /// <param name="nullValueHandling">The null value handling.</param>
        /// <param name="typeNameHandling">The type name handling.</param>
        /// <returns></returns>
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

        /// <summary>
        /// Gets the instance.
        /// </summary>
        /// <value>
        /// The instance.
        /// </value>
        public static BeetleConfig Instance {
            get { return _defaultInstance ?? _instance.Value; }
            set { _defaultInstance = value; }
        }

        /// <summary>
        /// Creates the serializer.
        /// </summary>
        /// <returns></returns>
        public virtual JsonSerializer CreateSerializer() {
            return JsonSerializer.Create(JsonSerializerSettings);
        }

        /// <summary>
        /// Gets the json serializer settings.
        /// </summary>
        /// <value>
        /// The json serializer settings.
        /// </value>
        public JsonSerializerSettings JsonSerializerSettings {
            get { return _settings; }
        }
    }
}
