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
        private readonly BeetleConfig _config;

        public BeetleValueProviderFactory(BeetleConfig config) {
            if (config == null) throw new ArgumentNullException(nameof(config));

            _config = config;
        }

        public override IValueProvider GetValueProvider(ControllerContext controllerContext) {
            if (controllerContext == null)
                throw new ArgumentNullException("controllerContext");

            if (!controllerContext.HttpContext.Request.ContentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase))
                return null;

            var streamReader = new StreamReader(controllerContext.HttpContext.Request.InputStream);
            var JSONReader = new JsonTextReader(streamReader);
            if (!JSONReader.Read())
                return null;

            var JSONSerializer = _config.CreateSerializer();
            JSONSerializer.Converters.Add(new ExpandoObjectConverter());

            object JSONObject;
            if (JSONReader.TokenType == JsonToken.StartArray)
                JSONObject = JSONSerializer.Deserialize<List<ExpandoObject>>(JSONReader);
            else
                JSONObject = JSONSerializer.Deserialize<ExpandoObject>(JSONReader);

            var backingStore = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            AddToBackingStore(backingStore, String.Empty, JSONObject);
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
