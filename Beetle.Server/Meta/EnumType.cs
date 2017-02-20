using System;
using System.Collections.Generic;
using System.Linq;

namespace Beetle.Server.Meta {

    public class EnumType: MetadataPart {

        public EnumType(string name, Func<string> displayNameGetter = null): base(name, displayNameGetter) {
            Members = new List<EnumMember>();
        }

        public List<EnumMember> Members { get; set; }

        public override object ToMinified() {
            return new {
                           n = Name,
                           r = ResourceName,
                           l = GetDisplayName(),
                           m = Members.Select(m => m.ToMinified()).ToList()
                       };
        }
    }
}
