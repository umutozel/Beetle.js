using System;
using System.Collections.Generic;
using System.Linq;

namespace Beetle.Meta {

    public class DataProperty : MetadataPart {

        public DataProperty(string name, Func<string> displayNameGetter): base(name, displayNameGetter) {
            ColumnName = name;
            Validators = new List<Validator>();
        }

        public string ColumnName { get; set; }
        public DataType DataType { get; set; }
        public bool? IsNullable { get; set; }
        public int? Precision { get; set; }
        public int? Scale { get; set; }
        public bool? IsEnum { get; set; }
        public string EnumType { get; set; }
        public GenerationPattern? GenerationPattern { get; set; }
        public bool? UseForConcurrency { get; set; }
        public object DefaultValue { get; set; }
        public List<Validator> Validators { get; set; }

        public override object ToMinified() {
            string dt;
            if (IsEnum.HasValue && IsEnum.Value)
                dt = EnumType;
            else {
                dt = DataType.ToString();
                dt = dt.Substring(0, 1).ToLowerInvariant() + dt.Substring(1);
            }

            var g = GenerationPattern == null || GenerationPattern == Meta.GenerationPattern.None ? null : GenerationPattern.ToString().Substring(0, 1);

            return new {
                n = Name,
                r = ResourceName,
                l = GetDisplayName(),
                t = dt,
                i = IsNullable,
                p = Precision,
                s = Scale,
                e = IsEnum,
                g,
                d = DefaultValue,
                c = UseForConcurrency,
                v = Validators.Select(x => x.ToMinified()).ToList()
            };
        }
    }
}
