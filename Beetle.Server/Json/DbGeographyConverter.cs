using System;
using System.Data.Spatial;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Beetle.Server.Json {

    /// <summary>
    /// DbGeography Spatial Type converter.
    /// </summary>
    public class DbGeographyConverter : JsonConverter {

        /// <summary>
        /// Writes the json.
        /// </summary>
        /// <param name="writer">The writer.</param>
        /// <param name="value">The value.</param>
        /// <param name="serializer">The serializer.</param>
        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer) {
            var geography = (DbGeography) value;
            serializer.Serialize(writer, geography.WellKnownValue);
        }

        /// <summary>
        /// Reads the json.
        /// </summary>
        /// <param name="reader">The reader.</param>
        /// <param name="objectType">Type of the object.</param>
        /// <param name="existingValue">The existing value.</param>
        /// <param name="serializer">The serializer.</param>
        /// <returns></returns>
        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer) {
            var geography = JObject.Load(reader);
            var wellKnownText = geography["WellKnownText"].Value<string>();
            var jCoordinateSystemId = geography["CoordinateSystemId"];
            return jCoordinateSystemId != null 
                ? DbGeography.FromText(wellKnownText, jCoordinateSystemId.Value<int>())
                : DbGeography.FromText(wellKnownText);
        }

        /// <summary>
        /// Determines whether this instance can convert the specified object type.
        /// </summary>
        /// <param name="objectType">Type of the object.</param>
        /// <returns>
        ///   <c>true</c> if this instance can convert the specified object type; otherwise, <c>false</c>.
        /// </returns>
        public override bool CanConvert(Type objectType) {
            return objectType == typeof(DbGeography);
        }
    }
}
