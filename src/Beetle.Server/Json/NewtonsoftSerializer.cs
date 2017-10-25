using System;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;

namespace Beetle.Server.Json {
    using Interface;

    public class NewtonsoftSerializer : ISerializer {

        public NewtonsoftSerializer(JsonSerializerSettings settings) {
            Settings = settings;
            Settings.Converters.Add(new ExpandoObjectConverter());
            Settings.Converters.Add(new BeetleDateTimeConverter());
            Settings.Converters.Add(new ByteArrayConverter());
            Settings.Converters.Add(new TimeSpanConverter());
        }

        public string ContentType { get; } = "application/json";

        public Encoding Encoding { get; } = Encoding.UTF8;

        public JsonSerializerSettings Settings { get; }

        public string Serialize(object obj) => JsonConvert.SerializeObject(obj, Settings);

        public T Deserialize<T>(string str) => JsonConvert.DeserializeObject<T>(str, Settings);

        public object Deserialize(string str, Type type) => JsonConvert.DeserializeObject(str, type, Settings);

        public dynamic DeserializeToDynamic(string str) => JsonConvert.DeserializeObject<dynamic>(str, Settings);

        public object ConvertFromDynamic(dynamic value, Type type) => JsonSerializer.Create(Settings).Deserialize(new JTokenReader(value), type);
    }
}
