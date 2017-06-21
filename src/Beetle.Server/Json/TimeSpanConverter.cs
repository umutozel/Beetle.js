using System;
using Newtonsoft.Json;

namespace Beetle.Server.Json {

    /// <summary>
    // http://www.w3.org/TR/xmlschema-2/#duration
    /// </summary>
    public class TimeSpanConverter : JsonConverter {

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer) {
            var time = (TimeSpan)value;
            serializer.Serialize(writer, time.ToString());
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue,
                                        JsonSerializer serializer) {
            if (reader.TokenType == JsonToken.Null)
                return null;

            var value = serializer.Deserialize<String>(reader);
            return TimeSpan.Parse(value);
        }

        public override bool CanConvert(Type objectType) {
            return objectType == typeof(TimeSpan) || objectType == typeof(TimeSpan?);
        }
    }
}