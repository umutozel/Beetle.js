using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;

namespace Beetle.Server {

    public class NewtonsoftSerializer : ISerializer {
        private readonly JsonSerializerSettings _settings;

        public NewtonsoftSerializer(JsonSerializerSettings settings) {
            _settings = settings;
            _settings.Converters.Add(new ExpandoObjectConverter());
        }

        public string Serialize(object obj) {
            return JsonConvert.SerializeObject(obj, _settings);
        }

        public T Deserialize<T>(string str) {
            return JsonConvert.DeserializeObject<T>(str, _settings);
        }

        public object Deserialize(string str, Type type) {
            return JsonConvert.DeserializeObject(str, type, _settings);
        }

        public dynamic DeserializeToDynamic(string str) {
            return JsonConvert.DeserializeObject<dynamic>(str, _settings);
        }

        public object ConvertFromDynamic(dynamic value, Type type) {
            var reader = new JTokenReader(value);
            return JsonSerializer.Create(Settings).Deserialize(reader, type);
        }

        public JsonSerializerSettings Settings {
            get { return _settings; }
        }
    }
}
