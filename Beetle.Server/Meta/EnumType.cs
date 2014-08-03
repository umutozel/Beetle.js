using System.Collections.Generic;
using System.Linq;

namespace Beetle.Server.Meta {

    /// <summary>
    /// Enum Type metadata representation.
    /// </summary>
    public class EnumType: MetadataPart {

        public EnumType(string name): base(name) {
            Members = new List<EnumMember>();
        }

        public List<EnumMember> Members { get; set; }

        public override object ToMinified() {
            return new {
                           n = Name,
                           r = ResourceName,
                           l = DisplayName,
                           m = Members.Select(m => m.ToMinified()).ToList()
                       };
        }
    }
}
