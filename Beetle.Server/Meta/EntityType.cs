using System;
using System.Collections.Generic;
using System.Linq;

namespace Beetle.Server.Meta {

    /// <summary>
    /// Entity Type metadata representation.
    /// </summary>
    public class EntityType : MetadataPart {

        public EntityType(string fullName, string shortName, Func<string> displayNameGetter = null)
            : base(fullName, displayNameGetter) {
            ShortName = shortName;
            TableName = shortName;
            Keys = new List<string>();
            DataProperties = new List<DataProperty>();
            AllDataProperties = new List<DataProperty>();
            NavigationProperties = new List<NavigationProperty>();
            AllNavigationProperties = new List<NavigationProperty>();
            ComplexProperties = new List<ComplexProperty>();
            AllComplexProperties = new List<ComplexProperty>();
            KeyProperties = new List<DataProperty>();
        }

        public string ShortName { get; set; }
        public string TableName { get; set; }
        public string QueryName { get; set; }
        public string QueryType { get; set; }
        public string BaseTypeName { get; set; }
        public EntityType BaseType { get; set; }
        public bool? IsComplexType { get; set; }
        public List<string> Keys { get; set; }
        public List<DataProperty> DataProperties { get; set; }
        public List<DataProperty> AllDataProperties { get; set; }
        public List<NavigationProperty> NavigationProperties { get; set; }
        public List<NavigationProperty> AllNavigationProperties { get; set; }
        public List<ComplexProperty> ComplexProperties { get; set; }
        public List<ComplexProperty> AllComplexProperties { get; set; }
        public List<DataProperty> KeyProperties { get; set; }
        public Type ClrType { get; set; }

        public override string GetDisplayName() {
            if (DisplayNameGetter != null) {
                try {
                    return DisplayNameGetter();
                }
                catch {
                    // ignored
                }
            }
            return null;
        }

        public override object ToMinified() {
            return new {
                n = Name,
                rn = ResourceName,
                l = GetDisplayName(),
                s = ShortName,
                q = QueryName,
                t = QueryType,
                b = BaseTypeName,
                c = IsComplexType,
                k = Keys,
                d = DataProperties.Select(dp => dp.ToMinified()).ToList(),
                r = NavigationProperties.Select(np => np.ToMinified()).ToList(),
                x = ComplexProperties.Select(cp => cp.ToMinified()).ToList()
            };
        }
    }
}
