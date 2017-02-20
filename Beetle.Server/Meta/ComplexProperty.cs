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
        private readonly string _columnName;
        private readonly string _propertyName;

        public ColumnMapping(string columnName, string propertyName) {
            _columnName = columnName;
            _propertyName = propertyName;
        }

        public string ColumnName {
            get { return _columnName; }
        }

        public string PropertyName {
            get { return _propertyName; }
        }
    }
}
