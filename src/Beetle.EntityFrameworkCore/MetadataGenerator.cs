using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace Beetle.EntityFrameworkCore {
    using Meta;
    using Server;

    public static class MetadataGenerator {

        public static Metadata Generate(DbContext context) {
            return Generate(context.Model.GetEntityTypes());
        }

        public static Metadata Generate(IEnumerable<IEntityType> entityTypes) {
            if (entityTypes == null)
                throw new ArgumentNullException(nameof(entityTypes));

            var metadata = new Metadata();
            // entity types
            var entityTypeList = entityTypes as IList<IEntityType> ?? entityTypes.ToList();
            foreach (var entityType in entityTypeList) {
                var fullName = $"{entityType.ClrType.FullName}, {entityType.ClrType.GetTypeInfo().Assembly.GetName().Name}";
                var tableName = entityType.GetAnnotation("Relational:TableName")?.Value.ToString();
                var et = new EntityType(fullName, entityType.ClrType.Name) {
                    TableName = tableName
                };

                var keys = entityType.GetKeys().Where(k => k.IsPrimaryKey()).SelectMany(k => k.Properties.Select(p => p.Name));
                et.Keys.AddRange(keys);
                if (entityType.BaseType != null) {
                    et.BaseTypeName = entityType.BaseType.ClrType.Name;
                }

                et.ClrType = entityType.ClrType;

                foreach (var navigation in entityType.GetDeclaredNavigations()) {
                    MetaUtils.GetDisplayInfo(navigation.ClrType, navigation.Name,
                                             out string resourceName, out Func<string> displayNameGetter);

                    var targetType = navigation.GetTargetType();
                    var np = new NavigationProperty(navigation.Name, displayNameGetter) {
                        ResourceName = resourceName,
                        EntityTypeName = targetType.Name,
                        IsScalar = !navigation.IsCollection()
                    };

                    np.AssociationName = navigation.ForeignKey.DeclaringEntityType.ClrType.Name + "_" +
                        navigation.ForeignKey.PrincipalEntityType.ClrType.Name + "_" +
                        string.Join("+", np.ForeignKeys);

                    np.ForeignKeys.AddRange(navigation.ForeignKey.Properties.Select(p => p.Name));
                    np.DoCascadeDelete = navigation.ForeignKey.DeleteBehavior == DeleteBehavior.Cascade;

                    if (entityType.ClrType != null) {
                        MetaUtils.PopulateNavigationPropertyValidations(entityType.ClrType, np);
                    }

                    et.NavigationProperties.Add(np);
                }

                foreach (var property in entityType.GetDeclaredProperties()) {
                    MetaUtils.GetDisplayInfo(entityType.ClrType, property.Name,
                                             out string resourceName, out Func<string> displayNameGetter);

                    var dp = new DataProperty(property.Name, displayNameGetter) {
                        ColumnName = property.FindAnnotation("Relational:ColumnName")?.Value.ToString(),
                        ResourceName = resourceName
                    };

                    var clrType = property.ClrType;
                    var jsType = DataType.Binary;
                    // convert CLR type to javascript type
                    if (clrType.GetTypeInfo().IsEnum) {
                        var enumType = property.ClrType;
                        var enumTypeName = enumType.Name;
                        if (metadata.Enums.All(e => e.Name != enumTypeName)) {
                            metadata.Enums.Add(MetaUtils.GenerateEnumType(property.ClrType));
                        }
                        dp.IsEnum = true;
                        dp.EnumType = enumTypeName;
                    }
                    else if (clrType == typeof(string)) {
                        jsType = DataType.String;
                    }
                    else if (clrType == typeof(Guid)) {
                        jsType = DataType.Guid;
                    }
                    else if (clrType == typeof(DateTime)) {
                        jsType = DataType.Date;
                    }
                    else if (clrType == typeof(DateTimeOffset)) {
                        jsType = DataType.DateTimeOffset;
                    }
                    else if (clrType == typeof(TimeSpan)) {
                        jsType = DataType.Time;
                    }
                    else if (clrType == typeof(bool)) {
                        jsType = DataType.Boolean;
                    }
                    else if (clrType == typeof(Int16) || clrType == typeof(Int64) || clrType == typeof(Int32)) {
                        jsType = DataType.Int;
                    }
                    else if (clrType == typeof(Single) || clrType == typeof(double) || clrType == typeof(decimal)) {
                        jsType = DataType.Number;
                    }
                    else if (clrType == typeof(byte)) {
                        jsType = DataType.Byte;
                    }
                    else if (clrType == typeof(byte[])) {
                        jsType = DataType.Binary;
                    }

                    dp.DataType = jsType;
                    if (property.ValueGenerated == ValueGenerated.OnAdd) {
                        dp.GenerationPattern = GenerationPattern.Identity;
                    }
                    else if (property.ValueGenerated == ValueGenerated.OnAddOrUpdate) {
                        dp.GenerationPattern = GenerationPattern.Computed;
                    }

                    dp.UseForConcurrency = property.IsConcurrencyToken;
                    dp.IsNullable = property.IsNullable;

                    MetaUtils.PopulateDataPropertyValidations(entityType.ClrType, dp);

                    et.DataProperties.Add(dp);
                }

                metadata.Entities.Add(et);
            }

            metadata.FixReferences();
            return metadata;
        }
    }
}
