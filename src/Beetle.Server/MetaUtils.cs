using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Reflection;
using ValidatorType = System.ComponentModel.DataAnnotations.DataType;

namespace Beetle.Server {
    using System.Linq.Dynamic;
    using Meta;
    using Properties;

    public static class MetaUtils {

        public static Metadata GenerateMetadata(IEnumerable<Type> types, string name) {
            var metadata = new Metadata(name);
            foreach (var type in types) {
                PopulateMetadata(type, metadata);
            }

            FixMetadata(metadata);

            return metadata;
        }

        public static void PopulateMetadata(Type type, Metadata metadata) {
            var typeInfo = type.GetTypeInfo();
            if (!typeInfo.IsClass || metadata.Entities.Any(e => e.ClrType == type)) return;

            var fullName = type.FullName + ", " + typeInfo.Assembly.GetName().Name;
            var entityType = new EntityType(fullName, type.Name, GetDisplayNameGetter(type));
            metadata.Entities.Add(entityType);
            entityType.ClrType = type;

            var properties = type.GetProperties(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly);

            if (typeInfo.BaseType != null && typeInfo.BaseType != typeof(object)) {
                if (typeInfo.BaseType.GetTypeInfo().GetCustomAttribute<NotMappedAttribute>() != null) {
                    properties = properties.Union(typeInfo.BaseType.GetProperties(BindingFlags.Instance | BindingFlags.Public)).ToArray();
                }
                else {
                    entityType.BaseTypeName = typeInfo.BaseType.Name;
                    PopulateMetadata(typeInfo.BaseType, metadata);
                }
            }

            foreach (var propertyInfo in properties) {
                var propertyType = propertyInfo.PropertyType;
                var propertyTypeInfo = propertyType.GetTypeInfo();
                if (entityType.DataProperties.Any(dp => dp.Name == propertyInfo.Name)
                    || propertyInfo.GetCustomAttribute<NotMappedAttribute>() != null) continue;

                var isNullable = false;
                if (propertyTypeInfo.IsGenericType && propertyType.GetGenericTypeDefinition() == typeof(Nullable<>)) {
                    isNullable = true;
                    propertyType = propertyType.GetGenericArguments().First();
                }
                else if (propertyType == typeof(string)) {
                    isNullable = true;
                }

                GetDisplayInfo(propertyInfo, out string resourceName, out Func<string> displayNameGetter);
                var dataType = GetDataType(propertyType);
                if (dataType == null) {
                    var isScalar = true;
                    var enumerable = propertyType
                        .GetInterfaces()
                        .Concat(new[] { propertyType })
                        .FirstOrDefault(i => i.GetTypeInfo().IsGenericType && i.GetGenericTypeDefinition() == typeof(IEnumerable<>));
                    if (enumerable != null) {
                        isScalar = false;
                        propertyType = enumerable.GetGenericArguments().First();

                        // skip value type collections (like List<string>)
                        if (GetDataType(propertyType) != null) continue;
                    }

                    PopulateMetadata(propertyType, metadata);

                    var navigationProperty = new NavigationProperty(propertyInfo.Name, displayNameGetter) {
                        EntityTypeName = propertyType.Name,
                        IsScalar = isScalar,
                        ResourceName = resourceName
                    };
                    var foreignKeys = properties
                        .Where(p => p.GetCustomAttribute<ForeignKeyAttribute>()?.Name == propertyInfo.Name)
                        .ToList();
                    var required = foreignKeys.Any() && foreignKeys
                        .All(p => !p.PropertyType.GetTypeInfo().IsGenericType
                                  || p.PropertyType.GetTypeInfo().GetGenericTypeDefinition() != typeof(Nullable<>));

                    navigationProperty.ForeignKeys = foreignKeys.Select(p => p.Name).ToList();
                    navigationProperty.DoCascadeDelete = required;
                    var assName = string.Join("_",
                        new[] { entityType.ShortName, navigationProperty.EntityTypeName }.OrderBy(s => s)
                    );
                    var j = 0;
                    while (entityType.AllNavigationProperties.Any(n => n.AssociationName == assName + j)) j++;
                    if (j > 0) assName += j;

                    navigationProperty.AssociationName = assName;

                    PopulateNavigationPropertyValidations(propertyInfo, navigationProperty);

                    entityType.NavigationProperties.Add(navigationProperty);
                }
                else {
                    object defaultValue = null;
                    var defaultValueAttribute = propertyInfo.GetCustomAttribute<DefaultValueAttribute>(true);
                    if (defaultValueAttribute != null) {
                        defaultValue = defaultValueAttribute.Value;
                    }

                    string enumType = null;
                    if (dataType == DataType.Enum) {
                        enumType = propertyType.Name;

                        if (metadata.Enums.All(e => e.Name != enumType)) {
                            metadata.Enums.Add(GenerateEnumType(propertyType));
                        }
                    }

                    var dataProperty = new DataProperty(propertyInfo.Name, displayNameGetter) {
                        ColumnName = propertyInfo.Name,
                        DataType = dataType.Value,
                        DefaultValue = defaultValue,
                        EnumType = enumType,
                        IsEnum = !string.IsNullOrEmpty(enumType),
                        IsNullable = isNullable,
                        ResourceName = resourceName
                    };

                    var keyAttribute = propertyInfo.GetCustomAttribute<KeyAttribute>();
                    if (keyAttribute != null) {
                        entityType.Keys.Add(dataProperty.Name);
                    }

                    var generationPattern = propertyInfo.GetCustomAttribute<DatabaseGeneratedAttribute>();
                    if (generationPattern != null) {
                        switch (generationPattern.DatabaseGeneratedOption) {
                            case DatabaseGeneratedOption.Computed:
                                dataProperty.GenerationPattern = GenerationPattern.Computed;
                                break;
                            case DatabaseGeneratedOption.Identity:
                                dataProperty.GenerationPattern = GenerationPattern.Identity;
                                break;
                        }
                    }

                    if (propertyInfo.GetCustomAttribute<ConcurrencyCheckAttribute>(true) != null
                        || propertyInfo.GetCustomAttribute<TimestampAttribute>(true) != null
                        || propertyInfo.Name == "RowVersion" && propertyType == typeof(byte[])) {
                        dataProperty.UseForConcurrency = true;
                    }

                    PopulateDataPropertyValidations(propertyInfo, propertyInfo.PropertyType, dataProperty);

                    entityType.DataProperties.Add(dataProperty);
                }
            }
        }

        private static void FixMetadata(Metadata metadata) {
            metadata.FixReferences();

            foreach (var entity in metadata.Entities) {
                if (!entity.Keys.Any()) {
                    var idProperty = entity.AllDataProperties
                        .FirstOrDefault(dp => dp.Name == "Id" || dp.Name == entity.ShortName + "Id");

                    if (idProperty != null) {
                        entity.Keys.Add(idProperty.Name);

                        var dt = idProperty.DataType;
                        if (dt == DataType.Int || dt == DataType.Byte || dt == DataType.Number) {
                            idProperty.GenerationPattern = GenerationPattern.Identity;
                        }
                    }
                }

                foreach (var navigationProperty in entity.NavigationProperties) {
                    if (navigationProperty.ForeignKeys != null && navigationProperty.ForeignKeys.Any()) continue;

                    var assName = navigationProperty.AssociationName;
                    var lastChar = assName.Last();

                    var suffix = "Id";
                    if (char.IsNumber(lastChar)) suffix = lastChar + suffix;

                    var inverse = navigationProperty.Inverse;
                    if (navigationProperty.IsScalar == false) {
                        var fkName = entity.ShortName + suffix;

                        var fp = navigationProperty.EntityType.DataProperties.FirstOrDefault(dp => dp.Name == fkName);
                        if (fp == null) continue;

                        navigationProperty.ForeignKeys = new List<string> { fp.Name };
                        if (inverse != null) {
                            inverse.ForeignKeys = navigationProperty.ForeignKeys;
                        }
                    }
                    else {
                        if (inverse != null && inverse.IsScalar == true) {
                            navigationProperty.ForeignKeys = entity.Keys.ToList(); // one-to-one
                        }
                        else {
                            var fkName1 = navigationProperty.EntityTypeName + suffix;
                            var fkName2 = navigationProperty.Name + suffix;

                            var fp = entity.DataProperties.FirstOrDefault(dp => dp.Name == fkName1 || dp.Name == fkName2);
                            if (fp == null) continue;

                            navigationProperty.ForeignKeys = new List<string> { fp.Name };
                            if (inverse != null) {
                                inverse.ForeignKeys = navigationProperty.ForeignKeys;
                            }
                        }
                    }
                }
            }
        }

        public static void GetDisplayInfo(Type type, string memberName, out string resourceName, out Func<string> displayNameGetter) {
            resourceName = null;
            displayNameGetter = null;

            var memberInfo = type?.GetMember(memberName).FirstOrDefault();
            if (memberInfo == null) return;

            GetDisplayInfo(memberInfo, out resourceName, out displayNameGetter);
        }

        public static void GetDisplayInfo(MemberInfo memberInfo, out string resourceName, out Func<string> displayNameGetter) {
            resourceName = null;
            displayNameGetter = null;

            var displayAttribute = memberInfo.GetCustomAttributes<DisplayAttribute>().FirstOrDefault();
            if (displayAttribute == null) return;

            displayNameGetter = displayAttribute.GetName;
            resourceName = displayAttribute.Name;
        }

        public static Func<string> GetDisplayNameGetter(Type type) {
            var displayAttribute = type.GetTypeInfo().GetCustomAttributes<DisplayNameAttribute>().FirstOrDefault();
            return () => displayAttribute?.DisplayName;
        }

        public static void PopulateNavigationPropertyValidations(Type clrType, NavigationProperty navigationProperty) {
            var clrProperty = clrType.GetMember(navigationProperty.Name).FirstOrDefault();
            PopulateNavigationPropertyValidations(clrProperty, navigationProperty);
        }

        public static void PopulateNavigationPropertyValidations(MemberInfo member, NavigationProperty navigationProperty) {
            var displayName = navigationProperty.GetDisplayName() ?? navigationProperty.Name;
            var dataAnnotations = member.GetCustomAttributes<ValidationAttribute>();
            foreach (var att in dataAnnotations) {
                string msg;
                var rmsg = att.ErrorMessageResourceName;
                try {
                    msg = att.FormatErrorMessage(displayName);
                }
                catch {
                    msg = null;
                }

                if (att is MaxLengthAttribute mal && mal.Length > 0) {
                    navigationProperty.Validators.Add(Validator.MaxLength(msg, rmsg, mal.Length));
                }
                else if (att is MinLengthAttribute mil && mil.Length > 0) {
                    navigationProperty.Validators.Add(Validator.MinLength(msg, rmsg, mil.Length));
                }
            }
        }

        public static void PopulateDataPropertyValidations(Type clrType, DataProperty dataProperty, int? maxLen = null) {
            var clrProperty = clrType.GetMember(dataProperty.Name).First();
            var clrPropertyType = Helper.GetMemberType(clrType, dataProperty.Name);
            PopulateDataPropertyValidations(clrProperty, clrPropertyType, dataProperty, maxLen);
        }

        public static void PopulateDataPropertyValidations(MemberInfo member, Type memberType, DataProperty dataProperty, int? maxLen = null) {
            var displayName = dataProperty.GetDisplayName() ?? dataProperty.Name;
            var dataAnnotations = member.GetCustomAttributes<ValidationAttribute>();
            foreach (var att in dataAnnotations) {
                string msg;
                var rmsg = att.ErrorMessageResourceName;
                try {
                    msg = att.FormatErrorMessage(displayName);
                }
                catch {
                    msg = null;
                }

                if (memberType == typeof(string)) {
                    if (att is StringLengthAttribute sl) {
                        var ml = maxLen.HasValue
                            ? (sl.MaximumLength < maxLen ? sl.MaximumLength : maxLen.Value)
                            : sl.MaximumLength;
                        dataProperty.Validators.Add(Validator.StringLength(msg, rmsg, sl.MinimumLength, ml));
                    }
                    else if (att is MaxLengthAttribute mal && mal.Length > 0) {
                        dataProperty.Validators.Add(Validator.MaxLength(msg, rmsg, mal.Length));
                    }
                    else if (att is MinLengthAttribute mil && mil.Length > 0) {
                        dataProperty.Validators.Add(Validator.MinLength(msg, rmsg, mil.Length));
                    }
                }

                if (att is RequiredAttribute re) {
                    dataProperty.Validators.Add(Validator.Required(msg, rmsg, re.AllowEmptyStrings));
                }
                else if (att is RangeAttribute ra) {
                    dataProperty.Validators.Add(Validator.Range(msg, rmsg, ra.Minimum, ra.Maximum));
                }
                else if (att is RegularExpressionAttribute rx) {
                    dataProperty.Validators.Add(Validator.RegularExpression(msg, rmsg, rx.Pattern));
                }
                else if (att is DataTypeAttribute dt) {
                    switch (dt.DataType) {
                        case ValidatorType.EmailAddress:
                            dataProperty.Validators.Add(Validator.EmailAddress(msg, rmsg));
                            break;
                        case ValidatorType.CreditCard:
                            dataProperty.Validators.Add(Validator.CreditCard(msg, rmsg));
                            break;
                        case ValidatorType.ImageUrl:
                        case ValidatorType.Url:
                            dataProperty.Validators.Add(Validator.Url(msg, rmsg));
                            break;
                        case ValidatorType.PhoneNumber:
                            dataProperty.Validators.Add(Validator.PhoneNumber(msg, rmsg));
                            break;
                        case ValidatorType.PostalCode:
                            dataProperty.Validators.Add(Validator.PostalCode(msg, rmsg));
                            break;
                        case ValidatorType.Time:
                            dataProperty.Validators.Add(Validator.Time(msg, rmsg));
                            break;
                    }
                }
                else if (att is CompareAttribute co) {
                    dataProperty.Validators.Add(Validator.Compare(msg, rmsg, co.OtherProperty));
                }
            }
        }

        public static DataType? GetDataType(Type type) {
            var typeCode = Helper.GetTypeCode(type);

            if (type == typeof(byte[]))
                return DataType.Binary;

            if (type == typeof(DateTimeOffset))
                return DataType.DateTimeOffset;

            if (type.GetTypeInfo().IsEnum)
                return DataType.Enum;

            if (type == typeof(Guid))
                return DataType.Guid;

            if (type == typeof(TimeSpan))
                return DataType.Time;

            switch (typeCode) {
                case TypeCode.Boolean:
                    return DataType.Boolean;
                case TypeCode.Byte:
                case TypeCode.SByte:
                    return DataType.Byte;
                case TypeCode.DateTime:
                    return DataType.Date;
                case TypeCode.UInt16:
                case TypeCode.UInt32:
                case TypeCode.UInt64:
                case TypeCode.Int16:
                case TypeCode.Int32:
                case TypeCode.Int64:
                    return DataType.Int;
                case TypeCode.Decimal:
                case TypeCode.Double:
                case TypeCode.Single:
                    return DataType.Number;
                case TypeCode.String:
                case TypeCode.Char:
                    return DataType.String;
                default:
                    return null;
            }
        }

        public static EnumType GenerateEnumType(Type enumType) {
            if (!enumType.GetTypeInfo().IsEnum)
                throw new ArgumentException(string.Format(Resources.TypeIsNotEnum, enumType.Name));

            var retVal = new EnumType(enumType.Name);
            var names = Enum.GetNames(enumType);
            foreach (var name in names) {
                var member = enumType.GetField(name);
                var value = Convert.ToInt32(Enum.Parse(enumType, name));

                GetDisplayInfo(member, out string resourceName, out Func<string> displayNameGetter);

                retVal.Members.Add(new EnumMember(name, displayNameGetter) {
                    ResourceName = resourceName,
                    Value = value
                });
            }

            return retVal;
        }

        public static IEnumerable<EntityBag> MergeEntities(IEnumerable<EntityBag> entityBags, Metadata metadata,
                                                           out IEnumerable<EntityBag> unmappedEntities) {
            if (entityBags == null)
                throw new ArgumentNullException(nameof(entityBags));

            var entityBagList = entityBags as IList<EntityBag> ?? entityBags.ToList();
            var entityList = entityBagList
                .Where(eb => eb.EntityState != EntityState.Deleted && eb.EntityState != EntityState.Detached)
                .Select(eb => eb.Entity).ToList();
            var mergedBagList = new List<EntityBag>();
            var unmappedEntityList = new List<EntityBag>();

            foreach (var entityBag in entityBagList) {
                if (entityBag.EntityState == EntityState.Deleted || entityBag.EntityState == EntityState.Detached)
                    continue;

                var entity = entityBag.Entity;
                var type = entity.GetType();
                var entityTypeName = string.Format("{0}, {1}", type.FullName, type.GetTypeInfo().Assembly.GetName().Name);
                if (entityBag.EntityType == null) {
                    entityBag.EntityType = entityBag.EntityType
                                           ?? metadata.Entities.FirstOrDefault(e => e.Name == entityTypeName);
                }

                var entityType = entityBag.EntityType;
                if (entityType == null) {
                    unmappedEntityList.Add(entityBag);
                    continue;
                }

                foreach (var navigationProperty in entityType.AllNavigationProperties) {
                    var navigationType = Helper.GetMemberType(type, navigationProperty.Name);
                    if (navigationType == null) continue;

                    if (navigationProperty.IsScalar == true) {
                        if (!navigationProperty.ForeignKeys.Any()) continue;

                        var navigationQuery = GetRelationQuery(entityList, entity, navigationType,
                            entityType.Keys, navigationProperty.ForeignKeys);
                        if (navigationQuery == null) continue;

                        var navigationEntity = Enumerable.SingleOrDefault((dynamic)navigationQuery);
                        if (navigationEntity == null) continue;

                        Helper.SetMemberValue(entity, navigationProperty.Name, navigationEntity);
                    }
                    else {
                        if (!navigationType.GetTypeInfo().IsGenericType) continue;

                        var navigationValue = Helper.GetMemberValue(entity, navigationProperty.Name);
                        if (navigationValue == null && !navigationType.GetTypeInfo().IsInterface) {
                            navigationValue = Activator.CreateInstance(navigationType);
                            Helper.SetMemberValue(entity, navigationProperty.Name, navigationValue);
                        }
                        if (navigationValue == null) continue;

                        var navigationQuery = GetRelationQuery(entityList, entity,
                            navigationType.GenericTypeArguments.Single(),
                            navigationProperty.ForeignKeys, entityType.Keys);
                        if (navigationQuery == null) continue;

                        var navigationEntities = Enumerable.ToList((dynamic)navigationQuery);
                        var containsMethod = navigationType.GetMethod("Contains");
                        var addMethod = navigationType.GetMethod("Add");
                        foreach (var navigationEntity in navigationEntities) {
                            if (containsMethod.Invoke(navigationValue, new object[] { navigationEntity }).Equals(false)) {
                                addMethod.Invoke(navigationValue, new object[] { navigationEntity });
                            }
                        }
                    }
                }

                mergedBagList.Add(entityBag);
            }

            unmappedEntities = unmappedEntityList;
            return mergedBagList;
        }

        private static IQueryable GetRelationQuery(IEnumerable entities, object keyEntity, Type relationType,
                                                   IReadOnlyList<string> keys, IReadOnlyList<string> foreignKeys) {
            if (!keys.Any() || keys.Count != foreignKeys.Count) return null;

            const string filter = "{0} == @{1}";
            var ofTypeMethod = typeof(Queryable).GetMethod("OfType");
            var navigationQuery = ofTypeMethod
                .MakeGenericMethod(relationType)
                .Invoke(null, new object[] { entities.AsQueryable() }) as IQueryable;
            var filters = new List<string>();
            var parameters = new List<object>();

            for (var i = 0; i < foreignKeys.Count; i++) {
                var keyName = keys[i];
                var foreignKeyName = foreignKeys[i];
                var foreignKeyValue = Helper.GetMemberValue(keyEntity, foreignKeyName);
                if (foreignKeyValue == null) return null;

                filters.Add(string.Format(filter, keyName, i));
                parameters.Add(foreignKeyValue);
            }

            return navigationQuery.Where(string.Join(" && ", filters), parameters.ToArray());
        }
    }
}
