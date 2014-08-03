using System;
using System.Data.Spatial;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Beetle.Server.Json {

    /// <summary>
    /// DbGeometry Spatial Type converter.
    /// </summary>
    public class DbGeometryConverter : JsonConverter {

        /// <summary>
        /// Writes the json.
        /// </summary>
        /// <param name="writer">The writer.</param>
        /// <param name="value">The value.</param>
        /// <param name="serializer">The serializer.</param>
        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer) {
            var geometry = (DbGeometry) value;
            serializer.Serialize(writer, geometry.WellKnownValue);
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
            var geometry = JObject.Load(reader);
            var wellKnownText = geometry["WellKnownText"].Value<string>();
            var jCoordinateSystemId = geometry["CoordinateSystemId"];
            return jCoordinateSystemId != null
                ? DbGeometry.FromText(wellKnownText, jCoordinateSystemId.Value<int>())
                : DbGeometry.FromText(wellKnownText);
        }

        /// <summary>
        /// Determines whether this instance can convert the specified object type.
        /// </summary>
        /// <param name="objectType">Type of the object.</param>
        /// <returns>
        ///   <c>true</c> if this instance can convert the specified object type; otherwise, <c>false</c>.
        /// </returns>
        public override bool CanConvert(Type objectType) {
            return objectType == typeof(DbGeometry);
        }
    }
}
