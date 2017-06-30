using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;

namespace Beetle.Server.Json {
    using Interface;

    public class NewtonsoftSerializer : ISerializer {

        public NewtonsoftSerializer(JsonSerializerSettings settings) {
            Settings = settings;
            Settings.Converters.Add(new ExpandoObjectConverter());
        }

        public JsonSerializerSettings Settings { get; }

        public string Serialize(object obj) {
            return JsonConvert.SerializeObject(obj, Settings);
        }

        public T Deserialize<T>(string str) {
            return JsonConvert.DeserializeObject<T>(str, Settings);
        }

        public object Deserialize(string str, Type type) {
            return JsonConvert.DeserializeObject(str, type, Settings);
        }

        public dynamic DeserializeToDynamic(string str) {
            return JsonConvert.DeserializeObject<dynamic>(str, Settings);
        }

        public object ConvertFromDynamic(dynamic value, Type type) {
            var reader = new JTokenReader(value);
            return JsonSerializer.Create(Settings).Deserialize(reader, type);
        }
    }
}
