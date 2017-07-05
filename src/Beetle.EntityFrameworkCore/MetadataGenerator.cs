using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace Beetle.EntityFrameworkCore {
    using Meta;
    using ServerHelper = Server.Helper;

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
                //todo: table name
                var et = new EntityType(fullName, entityType.Name) { TableName = "" };

                // entity informations
                //todo: query name and type
                et.QueryName = "";
                et.QueryType = null;

                var keys = entityType.GetKeys().Where(k => k.IsPrimaryKey()).SelectMany(k => k.Properties.Select(p => p.Name));
                et.Keys.AddRange(keys);
                // if entity has base type, set the base type's name
                if (entityType.BaseType != null) {
                    et.BaseTypeName = entityType.BaseType.Name;
                }

                et.ClrType = entityType.ClrType;

                // navigation properties
                foreach (var navigation in entityType.GetDeclaredNavigations()) {
                    ServerHelper.GetDisplayInfo(navigation.ClrType, navigation.Name,
                                                out string resourceName, out Func<string> displayNameGetter);

                    var targetType = navigation.GetTargetType();
                    var np = new NavigationProperty(navigation.Name, displayNameGetter) {
                        ResourceName = resourceName,
                        EntityTypeName = targetType.Name
                    };

                    np.IsScalar = !navigation.IsCollection();
                    np.ForeignKeys.AddRange(navigation.ForeignKey.Properties.Select(p => p.Name));

                    //todo: cascade delete
                    np.DoCascadeDelete = true;

                    if (entityType.ClrType != null) {
                        ServerHelper.PopulateNavigationPropertyValidations(entityType.ClrType, np);
                    }

                    et.NavigationProperties.Add(np);
                }

                // data properties
                foreach (var property in entityType.GetDeclaredProperties()) {
                    ServerHelper.GetDisplayInfo(entityType.ClrType, property.Name,
                                                out string resourceName, out Func<string> displayNameGetter);

                    var dp = new DataProperty(property.Name, displayNameGetter) {
                        // todo: column name
                        ColumnName = "",
                        ResourceName = resourceName
                    };

                    var clrType = property.ClrType;
                    var jsType = DataType.Binary;
                    // convert CLR type to javascript type
                    if (clrType.GetTypeInfo().IsEnum) {

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
                    //todo: generation pattern
                    dp.GenerationPattern = GenerationPattern.None;

                    dp.UseForConcurrency = property.IsConcurrencyToken;
                    dp.IsNullable = property.IsNullable;

                    if (jsType == DataType.Number) {
                        //var precision = GetPrecision(p);
                        //var scale = GetScale(p);
                        //if (precision.HasValue)
                        //    dp.Precision = precision;
                        //if (scale.HasValue)
                        //    dp.Scale = scale;
                    }

                    ServerHelper.PopulateDataPropertyValidations(entityType.ClrType, dp/*, GetMaxStringLength(p) */);

                    // todo: default value
                    dp.DefaultValue = null;

                    //todo: GetMaxStringLength, GetPrecision, GetScale, IsConcurrencyProperty
                    et.DataProperties.Add(dp);
                }
                metadata.Entities.Add(et);
            }

            metadata.FixReferences();
            return metadata;
        }
    }
}
