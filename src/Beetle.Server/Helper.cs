using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection;
using Beetle.Server.Meta;
using Beetle.Server.Properties;
using Validator = System.ComponentModel.DataAnnotations.Validator;

namespace Beetle.Server {
    using Interface;

    public static class Helper {
        private const BindingFlags Binding = BindingFlags.Instance | BindingFlags.Public;

        #region General

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

        #endregion

        #region Request-Response Operations

        public static List<BeetleParameter> GetBeetleParameters(IDictionary<string, string> parameters) {
            return parameters?.Keys
                .Where(k => !string.IsNullOrWhiteSpace(k) && k.StartsWith("!e"))
                .Select(k => {
                    var v = parameters[k];
                    var i = v.IndexOf(':');
                    return new BeetleParameter(v.Substring(0, i), v.Substring(i + 1));
                })
                .ToList();
        }

        public static ProcessResult DefaultRequestProcessor(object contentValue, IDictionary<string, string> beetlePrms, 
                                                            ActionContext actionContext, IBeetleService service, 
                                                            IContextHandler contextHandler, IBeetleConfig actionConfig) {
            var queryable = contentValue as IQueryable;
            if (queryable != null) {
                var queryableHandler = GetQueryHandler(actionConfig, service);
                return queryableHandler.HandleContent(queryable, beetlePrms, actionContext, service);
            }

            if (contentValue is string) return new ProcessResult(actionContext) { Result = contentValue };

            var enumerable = contentValue as IEnumerable;
            if (enumerable == null) return new ProcessResult(actionContext) { Result = contentValue };

            var enumerableHandler = GetEnumerableHandler(actionConfig, service);
            return enumerableHandler.HandleContent(enumerable, beetlePrms, actionContext, service);
        }

        public static IEnumerable<EntityBag> ResolveEntities(dynamic bundle, IBeetleConfig config, Metadata metadata,
                                                             out IEnumerable<EntityBag> unknownEntities) {
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
                    var typeName = string.Format("{0}, {1}", type.FullName, type.GetTypeInfo().Assembly.GetName().Name);
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
            if (clientEntity == null) throw new ArgumentNullException(nameof(clientEntity));
            if (entity == null) throw new ArgumentNullException(nameof(entity));
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
            var config = actionConfig ?? service?.BeetleConfig;
            return config?.QueryableHandler
                ?? service?.ContextHandler?.QueryableHandler
                ?? QueryableHandler.Instance;
        }

        public static IContentHandler<IEnumerable> GetEnumerableHandler(IBeetleConfig actionConfig, IBeetleService service) {
            var config = actionConfig ?? service?.BeetleConfig;
            return config?.EnumerableHandler
                ?? service?.ContextHandler?.EnumerableHandler
                ?? EnumerableHandler.Instance;
        }

        public static int CreateQueryHash(string saltStr) {
            var hash = 0;
            var len = saltStr.Length;
            if (saltStr.Length == 0) return hash;

            for (var i = 0; i < len; i++) {
                var chr = saltStr[i];
                hash = (hash << 5) - hash + chr;
                hash |= 0;
            }
            return hash;
        }

        #endregion
    }
}