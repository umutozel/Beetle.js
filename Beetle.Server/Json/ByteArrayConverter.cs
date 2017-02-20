using System;
using Newtonsoft.Json;

namespace Beetle.Server.Json {

    public class ByteArrayConverter : JsonConverter {

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer) {
            var bytesStr = JsonConvert.SerializeObject(value);
            serializer.Serialize(writer, bytesStr);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer) {
            var bytes = JsonConvert.DeserializeObject(reader.Value.ToString(), objectType);
            return bytes;
        }

        public override bool CanConvert(Type objectType) {
            return objectType == typeof(byte[]);
        }
    }
}
