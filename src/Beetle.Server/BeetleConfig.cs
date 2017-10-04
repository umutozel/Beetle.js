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
    /// But it is possible to use another serializer.
    /// </summary>
    public class BeetleConfig : IBeetleConfig {
        private static readonly Lazy<BeetleConfig> _instance = new Lazy<BeetleConfig>();

        public BeetleConfig() : this(NullValueHandling.Include) {
        }

        public BeetleConfig(NullValueHandling nullValueHandling,
                            TypeNameHandling typeNameHandling = TypeNameHandling.Objects,
                            Formatting formatting = Formatting.Indented,
                            ReferenceLoopHandling referenceLoopHandling = ReferenceLoopHandling.Ignore,
                            PreserveReferencesHandling preserveReferencesHandling = PreserveReferencesHandling.Objects,
                            DateTimeZoneHandling dateTimeZoneHandling = DateTimeZoneHandling.Local)
            : this(new JsonSerializerSettings {
                NullValueHandling = nullValueHandling,
                TypeNameHandling = typeNameHandling,
                TypeNameAssemblyFormatHandling = TypeNameAssemblyFormatHandling.Simple,
                Formatting = formatting,
                ReferenceLoopHandling = referenceLoopHandling,
                PreserveReferencesHandling = preserveReferencesHandling,
                DateTimeZoneHandling = dateTimeZoneHandling
            }) {
        }

        public BeetleConfig(JsonSerializerSettings jsonSerializerSettings) {
            JsonSerializerSettings = jsonSerializerSettings;
            Serializer = new NewtonsoftSerializer(JsonSerializerSettings);
        }

        public static BeetleConfig Instance => _instance.Value;

        public JsonSerializerSettings JsonSerializerSettings { get; }

        public NewtonsoftSerializer Serializer { get; }

        public virtual IQueryHandler<IQueryable> QueryableHandler { get; } = null;

        public virtual IContentHandler<IEnumerable> EnumerableHandler { get; } = null;

        ISerializer IBeetleConfig.Serializer => Serializer;

        public virtual JsonSerializer CreateSerializer() {
            return JsonSerializer.Create(JsonSerializerSettings);
        }
    }
}
