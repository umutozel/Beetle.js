using System;
using System.Data.Spatial;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Beetle.Server.Json {

    public class DbGeometryConverter : JsonConverter {

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer) {
            var geometry = (DbGeometry) value;
            serializer.Serialize(writer, geometry.WellKnownValue);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer) {
            var geometry = JObject.Load(reader);
            var wellKnownText = geometry["WellKnownText"].Value<string>();
            var jCoordinateSystemId = geometry["CoordinateSystemId"];
            return jCoordinateSystemId != null
                ? DbGeometry.FromText(wellKnownText, jCoordinateSystemId.Value<int>())
                : DbGeometry.FromText(wellKnownText);
        }

        public override bool CanConvert(Type objectType) {
            return objectType == typeof(DbGeometry);
        }
    }
}
