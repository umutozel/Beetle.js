using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection;

namespace Beetle.Server {
    using Interface;
    using Meta;
    using Properties;
    using Validator = Validator;

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
                SetMemberValue(destination, p.Name, config.Serializer.ConvertFromDynamic(value, propType));
            }
        }

        public static List<BeetleParameter> GetBeetleParameters(IDictionary<string, string> queryParams) {
            return queryParams?.Keys
                .Where(k => !string.IsNullOrWhiteSpace(k) && k.StartsWith("!e"))
                .Select(k => {
                    var v = queryParams[k];
                    var i = v.IndexOf(':');
                    if (i < 0) return null;
                    return new BeetleParameter(v.Substring(0, i), v.Substring(i + 1));
                })
                .Where(b => b != null)
                .ToList();
        }

        public static ProcessResult DefaultRequestProcessor(ActionContext actionContext) {
            var value = actionContext.Value;
            if (actionContext.Value is IQueryable queryable) {
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

        public static List<EntityValidationResult> ValidateEntities(IEnumerable entities) {
            var validationResults = new List<EntityValidationResult>();
            foreach (var entity in entities) {
                var results = new List<ValidationResult>();
                var context = new ValidationContext(entity, null, null);
                Validator.TryValidateObject(entity, context, results, true);
                if (results.Any()) {
                    validationResults.Add(new EntityValidationResult(entity, results));
                }
            }
            return validationResults;
        }

        internal static IQueryHandler<IQueryable> GetQueryHandler(IBeetleConfig actionConfig, IBeetleService service) {
            var config = actionConfig ?? service?.Config;
            return config?.QueryableHandler
                ?? service?.ContextHandler?.QueryableHandler
                ?? QueryableHandler.Instance;
        }

        internal static IContentHandler<IEnumerable> GetEnumerableHandler(IBeetleConfig actionConfig, IBeetleService service) {
            var config = actionConfig ?? service?.Config;
            return config?.EnumerableHandler
                ?? service?.ContextHandler?.EnumerableHandler
                ?? EnumerableHandler.Instance;
        }

        internal static TypeCode GetTypeCode(Type type) {
#if NET_STANDARD
            if (type == null) return TypeCode.Empty;
            if (type == typeof(bool)) return TypeCode.Boolean;
            if (type == typeof(byte)) return TypeCode.Byte;
            if (type == typeof(char)) return TypeCode.Char;
            if (type == typeof(DateTime)) return TypeCode.DateTime;
            if (type == typeof(decimal)) return TypeCode.Decimal;
            if (type == typeof(double)) return TypeCode.Double;
            if (type == typeof(short)) return TypeCode.Int16;
            if (type == typeof(int)) return TypeCode.Int32;
            if (type == typeof(long)) return TypeCode.Int64;
            if (type == typeof(sbyte)) return TypeCode.SByte;
            if (type == typeof(float)) return TypeCode.Single;
            if (type == typeof(string)) return TypeCode.String;
            if (type == typeof(ushort)) return TypeCode.UInt16;
            if (type == typeof(uint)) return TypeCode.UInt32;
            if (type == typeof(ulong)) return TypeCode.UInt64;

            return TypeCode.Object;
#else
            return Type.GetTypeCode(type);
#endif
        }
    }
}