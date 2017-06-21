using System;
using System.Collections.Generic;

namespace Beetle.Server.Meta {

    public class ComplexProperty: MetadataPart {

        public ComplexProperty(string name, Func<string> displayNameGetter): base(name, displayNameGetter) {
        }

        public string TypeName { get; set; }
        public IEnumerable<ColumnMapping> Mappings { get; set; }
        public EntityType ComplexType { get; set; }

        public override object ToMinified() {
            return new {
                           r = ResourceName,
                           l = GetDisplayName(),
                           t = TypeName
                       };
        }
    }

    public class ColumnMapping {

        public ColumnMapping(string columnName, string propertyName) {
            ColumnName = columnName;
            PropertyName = propertyName;
        }

        public string ColumnName { get; }

        public string PropertyName { get; }
    }
}
