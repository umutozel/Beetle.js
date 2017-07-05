using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection;
using ValidatorType = System.ComponentModel.DataAnnotations.DataType;

namespace Beetle.Server {
    using Interface;
    using Meta;
    using Properties;

    public static class Helper {
        private const BindingFlags Binding = BindingFlags.Instance | BindingFlags.Public;

        public static Type GetMemberType(Type type, string memberName) {
            if (string.IsNullOrWhiteSpace(memberName)) throw new ArgumentNullException(nameof(memberName));

            var member = type.GetMember(memberName, Binding).FirstOrDefault();

            if (member is PropertyInfo propertyInfo)
                return propertyInfo.PropertyType;

            if (member is FieldInfo fieldInfo)
                return fieldInfo.FieldType;

            throw new BeetleException(string.Format(Resources.CannotFindPublicInstanceFieldOrProperty, memberName));
        }

        public static object GetMemberValue(object obj, string memberName) {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            if (string.IsNullOrWhiteSpace(memberName)) throw new ArgumentNullException(nameof(memberName));

            var type = obj.GetType();
            var member = type.GetMember(memberName, Binding).FirstOrDefault();

            if (member is PropertyInfo propertyInfo)
                return propertyInfo.GetValue(obj);

            if (member is FieldInfo fieldInfo)
                return fieldInfo.GetValue(obj);

            throw new BeetleException(string.Format(Resources.CannotFindPublicInstanceFieldOrProperty, memberName));
        }

        public static void SetMemberValue(object obj, string memberName, object value) {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            if (string.IsNullOrWhiteSpace(memberName)) throw new ArgumentNullException(nameof(memberName));

            var type = obj.GetType();
            var member = type.GetMember(memberName, Binding).FirstOrDefault();

            if (member is PropertyInfo propertyInfo) {
                if (propertyInfo.SetMethod == null)
                    throw new BeetleException(string.Format(Resources.CannotSetReadOnlyProperty, memberName));

                propertyInfo.SetValue(obj, value);
                return;
            }

            if (member is FieldInfo fieldInfo)
                fieldInfo.SetValue(obj, value);
            else
                throw new BeetleException(string.Format(Resources.CannotFindPublicInstanceFieldOrProperty, memberName));
        }

        public static object CreateType(string typeName, string initialValues, IBeetleConfig config) {
            var type = Type.GetType(typeName);
            if (type == null) throw new ArgumentException(string.Format(Resources.TypeCouldNotBeFound, typeName));

            var obj = Activator.CreateInstance(type);
            CopyValuesFromJson(initialValues, obj, config);
            return obj;
        }

        public static void CopyValuesFromJson(string source, object destination, IBeetleConfig config) {
            if (string.IsNullOrEmpty(source)) return;

            var obj = config.Serializer.DeserializeToDynamic(source);
            var type = destination.GetType();
            foreach (var p in obj.Properties()) {
                var propType = GetMemberType(type, p.Name);
                var value = obj[p.Name];
                config.Serializer.ConvertFromDynamic(value, propType);
                SetMemberValue(destination, p.Name, value);
            }
        }

        public static List<BeetleParameter> GetBeetleParameters(IDictionary<string, string> queryParams) {
            return queryParams?.Keys
                .Where(k => !string.IsNullOrWhiteSpace(k) && k.StartsWith("!e"))
                .Select(k => {
                    var v = queryParams[k];
                    var i = v.IndexOf(':');
                    return new BeetleParameter(v.Substring(0, i), v.Substring(i + 1));
                })
                .ToList();
        }

        public static ProcessResult DefaultRequestProcessor(ActionContext actionContext) {
            var value = actionContext.Value;
            var queryable = actionContext.Value as IQueryable;
            if (queryable != null) {
                var queryableHandler = GetQueryHandler(actionContext.Config, actionContext.Service);
                return queryableHandler.HandleContent(queryable, actionContext);
            }

            if (value is string || !(value is IEnumerable))
                return new ProcessResult(actionContext) { Result = value };

            var enumerableHandler = GetEnumerableHandler(actionContext.Config, actionContext.Service);
            return enumerableHandler.HandleContent((IEnumerable)value, actionContext);
        }

        public static IList<EntityBag> ResolveEntities(dynamic bundle, IBeetleConfig config, Metadata metadata,
                                                       out IList<EntityBag> unknownEntities) {
            if (config == null) {
                config = BeetleConfig.Instance;
            }

            var dynEntities = (IEnumerable)bundle.entities;
            var entities = new List<EntityBag>();
            var unknowns = new List<EntityBag>();
            bool forceUpdatePackage = bundle.forceUpdate ?? false;
            foreach (dynamic dynEntity in dynEntities) {
                // get entity tracking information
                var tracker = dynEntity["$t"];
                if (tracker == null) throw new InvalidOperationException(Resources.CannotFindTrackerInfo);

                // get entity type and other information
                string typeName = tracker.t.ToString();
                var type = Type.GetType(typeName);
                var state = Enum.Parse(typeof(EntityState), tracker.s.ToString());
                var originalValues = new Dictionary<string, object>();
                // entity's index in the client save array
                var index = int.Parse(tracker.i.ToString());

                // read original values
                var ovs = tracker.o != null ? tracker.o as IEnumerable : null;
                if (ovs != null) {
                    foreach (dynamic ov in ovs) {
                        string name = ov.Name.ToString();
                        var loopType = name.Split('.').Aggregate(type, GetMemberType);
                        if (loopType == null)
                            throw new BeetleException(string.Format(Resources.OriginalValuePropertyCouldNotBeFound, ov.Name));

                        var value = config.Serializer.ConvertFromDynamic(ov.Value, loopType);
                        originalValues.Add(name, value);
                    }
                }

                // deserialize entity
                var forceUpdate = forceUpdatePackage || (bool)(tracker.f ?? false);
                if (type != null) {
                    var clientEntity = config.Serializer.ConvertFromDynamic(dynEntity, type);
                    var entity = config.Serializer.ConvertFromDynamic(dynEntity, type);
                    EntityType entityType = null;
                    if (metadata != null) {
                        entityType = metadata.Entities.FirstOrDefault(e => e.Name == typeName);
                    }

                    entities.Add(
                        new EntityBag(clientEntity, entity, state, originalValues, index, entityType, forceUpdate)
                    );
                }
                else {
                    unknowns.Add(new EntityBag(dynEntity, dynEntity, state, originalValues, index, forceUpdate));
                }
            }

            unknownEntities = unknowns;
            return entities;
        }

        public static List<GeneratedValue> GetGeneratedValues(IEnumerable<EntityBag> entityBags, Metadata metadata) {
            var retVal = new List<GeneratedValue>();

            // populate auto-generated values
            var changedBags = entityBags.Where(el => el.EntityState == EntityState.Added ||
                                                     el.EntityState == EntityState.Modified);
            foreach (var entityBag in changedBags) {
                var entityType = entityBag.EntityType;
                if (entityType == null) {
                    if (metadata == null)
                        throw new BeetleException(Resources.CannotGetGeneratedValues);

                    var type = entityBag.Entity.GetType();
                    var typeName = $"{type.FullName}, {type.GetTypeInfo().Assembly.GetName().Name}";
                    entityType = metadata.Entities.FirstOrDefault(e => e.Name == typeName);
                    entityBag.EntityType = entityType
                        ?? throw new BeetleException(string.Format(Resources.CannotFindMetadata, typeName));
                }

                var changedValues = GetGeneratedValues(entityBag.ClientEntity, entityBag.Entity, entityType);
                if (changedValues == null) continue;

                foreach (var cv in changedValues) {
                    var gv = new GeneratedValue(entityBag.Index, cv.Key, cv.Value);
                    if (entityType.Keys.Contains(cv.Key)) {
                        retVal.Insert(0, gv);
                    }
                    else {
                        retVal.Add(gv);
                    }
                }
            }

            return retVal;
        }

        public static Dictionary<string, object> GetGeneratedValues(object clientEntity, object entity, EntityType entityType) {
            if (entityType == null) throw new ArgumentNullException(nameof(entityType));
            if (entity.GetType() != clientEntity.GetType())
                throw new BeetleException(Resources.EntityAndClientEntityMustBeSameTypeToCompare);

            var retVal = new Dictionary<string, object>();

            // detect changed values after the client post.
            foreach (var property in entityType.AllDataProperties) {
                var oldValue = GetMemberValue(clientEntity, property.Name);
                var newValue = GetMemberValue(entity, property.Name);
                if (!Equals(oldValue, newValue)) {
                    retVal[property.Name] = newValue;
                }
            }

            foreach (var complexProperty in entityType.AllComplexProperties) {
                var oldValue = GetMemberValue(clientEntity, complexProperty.Name);
                var newValue = GetMemberValue(entity, complexProperty.Name);

                var generatedValues = GetGeneratedValues(oldValue, newValue, complexProperty.ComplexType);
                foreach (var gv in generatedValues) {
                    retVal[complexProperty.Name + "." + gv.Key] = gv.Value;
                }
            }

            return retVal;
        }

        public static IQueryHandler<IQueryable> GetQueryHandler(IBeetleConfig actionConfig, IBeetleService service) {
            var config = actionConfig ?? service?.Config;
            return config?.QueryableHandler
                ?? service?.ContextHandler?.QueryableHandler
                ?? QueryableHandler.Instance;
        }

        public static IContentHandler<IEnumerable> GetEnumerableHandler(IBeetleConfig actionConfig, IBeetleService service) {
            var config = actionConfig ?? service?.Config;
            return config?.EnumerableHandler
                ?? service?.ContextHandler?.EnumerableHandler
                ?? EnumerableHandler.Instance;
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
            var clrPropertyType = GetMemberType(clrType, dataProperty.Name);
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
    }
}