using System;
using System.Collections;
using System.Collections.Generic;
using System.Dynamic;
using System.Globalization;
using System.IO;
using System.Web.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace Beetle.Mvc {

    public class BeetleValueProviderFactory : ValueProviderFactory {
        private readonly JsonSerializerSettings _settings;

        public BeetleValueProviderFactory(JsonSerializerSettings settings) {
            _settings = settings ?? throw new ArgumentNullException(nameof(settings));
        }

        public override IValueProvider GetValueProvider(ControllerContext controllerContext) {
            if (controllerContext == null)
                throw new ArgumentNullException(nameof(controllerContext));

            var request = controllerContext.HttpContext.Request;
            if (!request.ContentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase))
                return null;

            var streamReader = new StreamReader(request.InputStream);
            var jsonReader = new JsonTextReader(streamReader);
            if (!jsonReader.Read())
                return null;

            var jsonSerializer = JsonSerializer.Create(_settings);
            jsonSerializer.Converters.Add(new ExpandoObjectConverter());

            object jsonObject;
            if (jsonReader.TokenType == JsonToken.StartArray) {
                jsonObject = jsonSerializer.Deserialize<List<ExpandoObject>>(jsonReader);
            }
            else {
                jsonObject = jsonSerializer.Deserialize<ExpandoObject>(jsonReader);
            }

            var backingStore = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            AddToBackingStore(backingStore, string.Empty, jsonObject);
            return new DictionaryValueProvider<object>(backingStore, CultureInfo.CurrentCulture);
        }

        private static void AddToBackingStore(IDictionary<string, object> backingStore, string prefix, object value) {
            if (value is IDictionary<string, object> d) {
                foreach (var entry in d) {
                    AddToBackingStore(backingStore, MakePropertyKey(prefix, entry.Key), entry.Value);
                }
                return;
            }

            if (value is IList l) {
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
            return string.IsNullOrEmpty(prefix) ? propertyName : prefix + "." + propertyName;
        }
    }
}
