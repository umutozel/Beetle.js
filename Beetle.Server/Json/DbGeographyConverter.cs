using System;
using System.Data.Spatial;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Beetle.Server.Json {

    public class DbGeographyConverter : JsonConverter {

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer) {
            var geography = (DbGeography) value;
            serializer.Serialize(writer, geography.WellKnownValue);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer) {
            var geography = JObject.Load(reader);
            var wellKnownText = geography["WellKnownText"].Value<string>();
            var jCoordinateSystemId = geography["CoordinateSystemId"];
            return jCoordinateSystemId != null 
                ? DbGeography.FromText(wellKnownText, jCoordinateSystemId.Value<int>())
                : DbGeography.FromText(wellKnownText);
        }

        public override bool CanConvert(Type objectType) {
            return objectType == typeof(DbGeography);
        }
    }
}
