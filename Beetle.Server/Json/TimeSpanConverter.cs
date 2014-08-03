using System;
using Newtonsoft.Json;

namespace Beetle.Server.Json {

    /// <summary>
    // http://www.w3.org/TR/xmlschema-2/#duration
    /// </summary>
    public class TimeSpanConverter : JsonConverter {

        /// <summary>
        /// Writes the json.
        /// </summary>
        /// <param name="writer">The writer.</param>
        /// <param name="value">The value.</param>
        /// <param name="serializer">The serializer.</param>
        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer) {
            var time = (TimeSpan)value;
            serializer.Serialize(writer, time.ToString());
        }

        /// <summary>
        /// Reads the json.
        /// </summary>
        /// <param name="reader">The reader.</param>
        /// <param name="objectType">Type of the object.</param>
        /// <param name="existingValue">The existing value.</param>
        /// <param name="serializer">The serializer.</param>
        /// <returns></returns>
        public override object ReadJson(JsonReader reader, Type objectType, object existingValue,
                                        JsonSerializer serializer) {
            if (reader.TokenType == JsonToken.Null)
                return null;

            var value = serializer.Deserialize<String>(reader);
            return TimeSpan.Parse(value);
        }

        /// <summary>
        /// Determines whether this instance can convert the specified object type.
        /// </summary>
        /// <param name="objectType">Type of the object.</param>
        /// <returns>
        ///   <c>true</c> if this instance can convert the specified object type; otherwise, <c>false</c>.
        /// </returns>
        public override bool CanConvert(Type objectType) {
            return objectType == typeof(TimeSpan) || objectType == typeof(TimeSpan?);
        }
    }
}