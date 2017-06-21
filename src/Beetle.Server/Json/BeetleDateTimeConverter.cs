using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace Beetle.Server.Json {

    public class BeetleDateTimeConverter : IsoDateTimeConverter {
        private static readonly List<string> _months = new List<string> { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer) {
            try {
                // First try to parse as ISO string.
                var value = base.ReadJson(reader, objectType, existingValue, serializer);
                if (value == null) return null;

                var dt = (DateTime)value;
                return serializer.DateTimeZoneHandling == DateTimeZoneHandling.Local ? dt.ToLocalTime() : dt;
            }
            catch (FormatException) {
                var value = reader.Value.ToString();

                // when format is not ISO, first try javascript date ticks.
                long ticks;
                if (long.TryParse(value, out ticks)) {
                    var tick = new DateTime(((ticks * 10000) + 621355968000000000));
                    return serializer.DateTimeZoneHandling == DateTimeZoneHandling.Local ? tick.ToLocalTime() : tick;
                }

                // and finally try to convert this value as it is a javascript date.
                try {
                    var utc = ParseJavascriptDate(value);
                    return serializer.DateTimeZoneHandling == DateTimeZoneHandling.Local ? utc.ToLocalTime() : utc;
                }
                catch {
                    throw new BeetleException($"Cannot convert {value} to DateTime.");
                }
            }
        }

        private DateTime ParseJavascriptDate(string value) {
            var parts = value.Split(' ');

            var day = Convert.ToInt32(parts[2]);
            var month = _months.IndexOf(parts[1]) + 1;

            string yearStr, timeStr, zoneStr;
            if (parts[4].Contains(":")) {
                yearStr = parts[3];
                timeStr = parts[4];
                zoneStr = parts[5];
            }
            else {
                yearStr = parts[5];
                timeStr = parts[3];
                zoneStr = parts[4];
            }

            var year = Convert.ToInt32(yearStr);

            var timeParts = timeStr.Split(':');
            var hour = Convert.ToInt32(timeParts[0]);
            var minute = Convert.ToInt32(timeParts[1]);
            var second = Convert.ToInt32(timeParts[2]);

            var zone = zoneStr[3] == '+' ? -1 : 1;
            var hourZone = Convert.ToInt32(zoneStr.Substring(4, 2)) * zone;
            var minuteZone = Convert.ToInt32(zoneStr.Substring(6, 2)) * zone;

            var dt = new DateTime(year, month, day, hour, minute, second);
            if (zone == -1 && (dt - DateTime.MinValue).TotalMinutes < -1 * ((hourZone * 60) + minuteZone)) return DateTime.MinValue;

            return dt.AddHours(hourZone).AddMinutes(minuteZone);
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer) {
            if (serializer.DateTimeZoneHandling == DateTimeZoneHandling.Local && value is DateTime dateValue) {
                value = dateValue.ToUniversalTime();
            }

            base.WriteJson(writer, value, serializer);
        }
    }
}
