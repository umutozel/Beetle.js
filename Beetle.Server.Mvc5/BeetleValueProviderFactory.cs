using System;
using System.Collections;
using System.Collections.Generic;
using System.Dynamic;
using System.Globalization;
using System.IO;
using System.Web.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace Beetle.Server.Mvc {

    public class BeetleValueProviderFactory : ValueProviderFactory {
        private readonly JsonSerializerSettings _settings;

        public BeetleValueProviderFactory(JsonSerializerSettings settings) {
            if (_settings == null) throw new ArgumentNullException(nameof(settings));

            _settings = settings;
        }

        public override IValueProvider GetValueProvider(ControllerContext controllerContext) {
            if (controllerContext == null)
                throw new ArgumentNullException("controllerContext");

            if (!controllerContext.HttpContext.Request.ContentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase))
                return null;

            var streamReader = new StreamReader(controllerContext.HttpContext.Request.InputStream);
            var jsonReader = new JsonTextReader(streamReader);
            if (!jsonReader.Read())
                return null;

            var jsonSerializer = JsonSerializer.Create(_settings);
            jsonSerializer.Converters.Add(new ExpandoObjectConverter());

            object jsonObject;
            if (jsonReader.TokenType == JsonToken.StartArray)
                jsonObject = jsonSerializer.Deserialize<List<ExpandoObject>>(jsonReader);
            else
                jsonObject = jsonSerializer.Deserialize<ExpandoObject>(jsonReader);

            var backingStore = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            AddToBackingStore(backingStore, string.Empty, jsonObject);
            return new DictionaryValueProvider<object>(backingStore, CultureInfo.CurrentCulture);
        }

        private static void AddToBackingStore(Dictionary<string, object> backingStore, string prefix, object value) {
            var d = value as IDictionary<string, object>;
            if (d != null) {
                foreach (var entry in d) {
                    AddToBackingStore(backingStore, MakePropertyKey(prefix, entry.Key), entry.Value);
                }
                return;
            }

            var l = value as IList;
            if (l != null) {
                for (var i = 0; i < l.Count; i++) {
                    AddToBackingStore(backingStore, MakeArrayKey(prefix, i), l[i]);
                }
                return;
            }

            backingStore[prefix] = value;
        }

        private static string MakeArrayKey(string prefix, int index) {
            return prefix + "[" + index.ToString(CultureInfo.InvariantCulture) + "]";
        }

        private static string MakePropertyKey(string prefix, string propertyName) {
            return (string.IsNullOrEmpty(prefix)) ? propertyName : prefix + "." + propertyName;
        }
    }
}
