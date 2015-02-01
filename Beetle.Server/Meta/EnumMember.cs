using System;

namespace Beetle.Server.Meta {

    /// <summary>
    /// Enum Member metadata representation.
    /// </summary>
    public class EnumMember: MetadataPart {

        public EnumMember(string name, Func<string> displayNameGetter): base(name, displayNameGetter) {
        }

        public object Value { get; set; }

        public override object ToMinified() {
            return new {
                           n = Name,
                           r = ResourceName,
                           l = GetDisplayName(),
                           v = Value
                       };
        }
    }
}
