using System;
using System.Collections.Generic;
using System.Linq;

namespace Beetle.Server.Meta {

    /// <summary>
    /// Model metadata representation.
    /// </summary>
    public class Metadata: MetadataPart {

        public Metadata(): this(string.Empty) {
        }

        public Metadata(string name, Func<string> displayNameGetter = null) : base(name, displayNameGetter) {
            Entities = new List<EntityType>();
            Enums = new List<EnumType>();
        }

        public List<EntityType> Entities { get; set; }
        public List<EnumType> Enums { get; set; }

        /// <summary>
        /// Fixes the references for base type, navigation property links etc..
        /// </summary>
        public void FixReferences() {
            // fix base type and navigation type references
            foreach (var entityType in Entities) {
                var entity = entityType;

                entity.AllDataProperties.Clear();
                entity.AllDataProperties.AddRange(entity.DataProperties);
                entity.AllNavigationProperties.Clear();
                entity.AllNavigationProperties.AddRange(entity.NavigationProperties);
                entity.AllComplexProperties.Clear();
                entity.AllComplexProperties.AddRange(entity.ComplexProperties);
                var loopEntity = entity;
                while (!string.IsNullOrEmpty(loopEntity.BaseTypeName)) {
                    loopEntity.BaseType = Entities.Single(et => et.ShortName == loopEntity.BaseTypeName);
                    entity.AllDataProperties.AddRange(loopEntity.BaseType.DataProperties);
                    entity.AllNavigationProperties.AddRange(loopEntity.BaseType.NavigationProperties);
                    entity.AllComplexProperties.AddRange(loopEntity.BaseType.ComplexProperties);
                    loopEntity = loopEntity.BaseType;
                }

                entity.KeyProperties.Clear();
                entity.KeyProperties.AddRange(entity.AllDataProperties.Where(dp => entity.Keys.Contains(dp.Name)));

                foreach (var navigationProperty in entity.NavigationProperties) {
                    navigationProperty.EntityType = Entities.Single(et => et.ShortName == navigationProperty.EntityTypeName);
                    navigationProperty.Inverse = navigationProperty.EntityType.NavigationProperties
                        .SingleOrDefault(np => np != navigationProperty && np.AssociationName == navigationProperty.AssociationName);
                }

                foreach (var complexProperty in entity.ComplexProperties) {
                    complexProperty.ComplexType = Entities.Single(ct => ct.IsComplexType.HasValue 
                                                                        && ct.IsComplexType.Value 
                                                                        && ct.ShortName == complexProperty.TypeName);
                }
            }
        }

        public override object ToMinified() {
            return new {
                           n = Name,
                           r = ResourceName,
                           l = GetDisplayName(),
                           m = Entities.Select(e => e.ToMinified()).ToList(),
                           e = Enums.Select(e => e.ToMinified()).ToList()
                       };
        }
    }
}
