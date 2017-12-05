using System;
using System.Collections.Generic;
using System.Linq;

namespace Beetle.Meta {

    public class NavigationProperty: MetadataPart {

        public NavigationProperty(string name, Func<string> displayNameGetter): base(name, displayNameGetter) {
            ForeignKeys = new List<string>();
            Validators = new List<Validator>();
        }

        public string EntityTypeName { get; set; }
        public EntityType EntityType { get; set; }
        public bool? IsScalar { get; set; }
        public string AssociationName { get; set; }
        public bool? DoCascadeDelete { get; set; }
        public List<string> ForeignKeys { get; set; }
        public List<Validator> Validators { get; set; } 
        public NavigationProperty Inverse { get; set; }

        public override object ToMinified() {
            var vs = Validators.Select(v => v.ToMinified()).ToList();
            return new {
                           n = Name,
                           r = ResourceName,
                           l = GetDisplayName(),
                           t = EntityTypeName,
                           s = IsScalar == true ? true : (bool?)null,
                           a = AssociationName,
                           c = DoCascadeDelete == true ? true : (bool?)null,
                           f = ForeignKeys.Any() ? ForeignKeys : null,
                           v = vs.Any() ? vs : null
                       };
        }
    }
}
