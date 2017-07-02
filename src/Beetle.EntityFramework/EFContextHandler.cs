using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Threading.Tasks;
using System.Data.Entity.Core.Objects;
using System.Data.Entity.Core.Metadata.Edm;
using EFEntityState = System.Data.Entity.EntityState;
using EFEntityType = System.Data.Entity.Core.Metadata.Edm.EntityType;

namespace Beetle.EntityFramework {
    using Meta;
    using Server;
    using Server.Interface;

    public class EFContextHandler<TContext> : ContextHandler<TContext> {

        #region Fields, Properties

        private DbContext _dbContext;
        private IObjectContextAdapter _objectContextAdapter;

        private ObjectContext _objectContext;
        protected ObjectContext ObjectContext {
            get {
                if (_objectContext != null) return _objectContext;
                lock (Lockers.ObjectContextLocker) {
                    return _objectContext ?? (_objectContext = _objectContextAdapter.ObjectContext);
                }
            }
        }

        private static ItemCollection _itemCollection;
        protected ItemCollection ItemCollection {
            get {
                if (_itemCollection != null) return _itemCollection;
                lock (Lockers.ItemCollectionLocker) {
                    return _itemCollection ?? (_itemCollection = ObjectContext.MetadataWorkspace.GetItemCollection(DataSpace.CSpace));
                }
            }
        }

        private static IEnumerable<EntityType> _entityTypes;
        protected IEnumerable<EntityType> EntityTypes {
            get {
                if (_entityTypes != null) return _entityTypes;
                lock (ItemCollection) {
                    return _entityTypes ?? (_entityTypes = ItemCollection.OfType<EntityType>().ToList());
                }
            }
        }

        private static IEnumerable<EntitySetBase> _entitySets;
        protected IEnumerable<EntitySetBase> EntitySets {
            get {
                if (_entitySets != null) return _entitySets;
                lock (ItemCollection) {
                    return _entitySets ?? (_entitySets = ItemCollection.OfType<EntityContainer>().SelectMany(ec => ec.BaseEntitySets).ToList());
                }
            }
        }

        private static ObjectItemCollection _objectItemCollection;
        protected ObjectItemCollection ObjectItemCollection {
            get {
                if (_objectItemCollection != null) return _objectItemCollection;
                lock (Lockers.ObjectItemCollectionLocker) {
                    if (typeof(ObjectContext).IsAssignableFrom(typeof(TContext)))
                        ObjectContext.MetadataWorkspace.LoadFromAssembly(ObjectContext.GetType().Assembly);
                    return _objectItemCollection ??
                        (_objectItemCollection = (ObjectItemCollection)ObjectContext.MetadataWorkspace.GetItemCollection(DataSpace.OSpace));
                }
            }
        }

        private static List<EntityType> _objectEntityTypes;
        protected List<EntityType> ObjectEntityTypes {
            get {
                if (_objectEntityTypes != null) return _objectEntityTypes;
                lock (ObjectItemCollection) {
                    if (_objectEntityTypes == null) {
                        var objectEntityTypes = _objectItemCollection.GetItems<EntityType>();
                        _objectEntityTypes = objectEntityTypes != null ? objectEntityTypes.ToList() : new List<EntityType>();
                    }
                    return _objectEntityTypes;
                }
            }
        }

        #endregion

        public EFContextHandler(): this(EFQueryHandler.Instance) {
        }

        public EFContextHandler(TContext context): this(context) {
        }

        public override void Initialize() {
            base.Initialize();

            _objectContext = Context as ObjectContext;
            if (_objectContext == null) {
                _objectContextAdapter = Context as IObjectContextAdapter;
                _dbContext = Context as DbContext;
            }
            if (_objectContext == null && _objectContextAdapter == null)
                throw new InvalidOperationException("Type parameter must inherit from ObjectContext or implement IObjectContextAdapter.");

            ValidateOnSaveEnabled = _dbContext == null;
            if (_objectContext != null) {
                _objectContext.ContextOptions.LazyLoadingEnabled = false;
                _objectContext.ContextOptions.ProxyCreationEnabled = false;
            }
            else if (_dbContext != null) {
                _dbContext.Configuration.ProxyCreationEnabled = false;
                _dbContext.Configuration.LazyLoadingEnabled = false;
            }
        }

        private static Metadata _metadata;
        public override Metadata Metadata() {
            if (_metadata != null) return _metadata;
            lock (Lockers.MetadataLocker) {
                var a = typeof(TContext).Assembly;
                return _metadata ?? (_metadata = MetadataGenerator.Generate(ObjectContext.MetadataWorkspace, ItemCollection, ObjectItemCollection, a));
            }
        }

        public override object CreateType(string typeName) {
            if (ObjectEntityTypes != null) {
                var oType = ObjectEntityTypes.FirstOrDefault(x => x.Name == typeName);
                if (oType != null) {
                    var clrType = ObjectItemCollection.GetClrType(oType);
                    return Activator.CreateInstance(clrType);
                }
            }

            return base.CreateType(typeName);
        }

        public IQueryable<TEntity> CreateQueryable<TEntity>() {
            if (_dbContext != null)
                return _dbContext.Set<TEntity>();

            var setName = FindEntitySet(typeof(TEntity));
            IQueryable<TEntity> query = ObjectContext.CreateQuery<TEntity>($"[{setName}]");
            return query.OfType<TEntity>();
        }

        public virtual IEnumerable<EntityBag> MergeEntities(IEnumerable<EntityBag> entities, out IEnumerable<EntityBag> unmappedEntities) {
            if (entities == null)
                throw new ArgumentNullException("entities");

            var unmappeds = new List<EntityBag>();
            var entityList = entities as IList<EntityBag> ?? entities.ToList();
            var mergeList = new Dictionary<ObjectStateEntry, EntityBag>();

            foreach (var entityBag in entityList) {
                var entity = entityBag.Entity;
                var entityType = EntityTypes.FirstOrDefault(et => et.Name == entity.GetType().Name);
                EntitySetBase set = null;
                if (entityType != null)
                    set = FindEntitySet(entityType);
                if (set == null) unmappeds.Add(entityBag);
                else {
                    var state = entityBag.EntityState;

                    // attach entity to entity set
                    ObjectContext.AddObject(set.Name, entity);
                    var entry = ObjectContext.ObjectStateManager.GetObjectStateEntry(entity);
                    entry.ChangeState(EFEntityState.Unchanged);
                    mergeList.Add(entry, entityBag);

                    // set original values for modified entities
                    if (state == EFEntityState.Modified) {
                        var originalValues = entry.GetUpdatableOriginalValues();

                        foreach (var originalValue in entityBag.OriginalValues) {
                            var propertyPaths = originalValue.Key.Split('.');
                            if (!propertyPaths.Any()) continue;

                            var loopOriginalValues = originalValues;
                            StructuralType loopType = entityType;
                            EdmMember property = null;
                            string lastPropertyName;
                            if (propertyPaths.Length > 1) {
                                for (var i = 0; i < propertyPaths.Length - 1; i++) {
                                    var propertyName = propertyPaths[i];
                                    property = loopType.Members.FirstOrDefault(p => p.Name == propertyName);
                                    if (property == null) break;

                                    var ordinal = loopOriginalValues.GetOrdinal(propertyName);
                                    loopOriginalValues = (OriginalValueRecord) loopOriginalValues.GetValue(ordinal);
                                    loopType = (StructuralType) property.TypeUsage.EdmType;
                                }
                                if (property == null) continue;

                                lastPropertyName = propertyPaths[propertyPaths.Length - 1];
                            }
                            else
                                lastPropertyName = originalValue.Key;

                            property = loopType.Members.FirstOrDefault(p => p.Name == lastPropertyName);
                            if (property == null) continue;

                            // if modified property is a ComplexType then set all properties of ComplexType to modified.
                            var complexType = property.TypeUsage.EdmType as ComplexType;
                            if (complexType != null)
                                PopulateComplexType(loopOriginalValues, property.Name, originalValue.Value, complexType);
                            else {
                                var ordinal = loopOriginalValues.GetOrdinal(property.Name);
                                loopOriginalValues.SetValue(ordinal, originalValue.Value);
                            }
                        }
                    }
                }
            }

            foreach (var merge in mergeList) {
                // and fix the entity state, and relations will also be fixed.
                if (merge.Value.EntityState == EFEntityState.Modified) {
                    if (merge.Key.State != EFEntityState.Modified && merge.Value.ForceUpdate)
                        merge.Key.ChangeState(EFEntityState.Modified);
                }
                else
                    merge.Key.ChangeState((EFEntityState)merge.Value.EntityState);
            }

            unmappedEntities = unmappeds;
            return mergeList.Select(m => m.Value);
        }

        private static void PopulateComplexType(OriginalValueRecord originalValues, string propertyName, object originalValue, ComplexType complexType) {
            var ordinal = originalValues.GetOrdinal(propertyName);
            originalValues = (OriginalValueRecord) originalValues.GetValue(ordinal);
            foreach (var cp in complexType.Properties) {
                var value = Helper.GetPropertyValue(originalValue, cp.Name);

                var loopComplexType = cp.TypeUsage.EdmType as ComplexType;
                if (loopComplexType != null)
                    PopulateComplexType(originalValues, cp.Name, value, loopComplexType);
                else {
                    var loopOrdinal = originalValues.GetOrdinal(cp.Name);
                    originalValues.SetValue(loopOrdinal, value);
                }
            }
        }

        public override async Task<SaveResult> SaveChanges(SaveContext saveContext) {
            var merges = MergeEntities(saveContext.Entities, out IEnumerable<EntityBag> unmappeds);
            var mergeList = merges == null
                ? new List<EntityBag>()
                : merges as List<EntityBag> ?? merges.ToList();

            var saveList = mergeList;
            var handledUnmappeds = HandleUnmappeds(unmappeds);
            var handledUnmappedList = handledUnmappeds == null 
                ? null 
                : handledUnmappeds as IList<EntityBag> ?? handledUnmappeds.ToList();
            if (handledUnmappedList != null && handledUnmappedList.Any()) {
                MergeEntities(handledUnmappedList, out IEnumerable<EntityBag> _);
                saveList = saveList.Concat(handledUnmappedList).ToList();
            }
            if (!saveList.Any()) return SaveResult.Empty;

            OnBeforeSaveChanges(new BeforeSaveEventArgs(saveContext));
            // do data annotation validations
            if (ValidateOnSaveEnabled) {
                var toValidate = saveList.Where(eb => eb.EntityState == EFEntityState.Added || eb.EntityState == EFEntityState.Modified).Select(eb => eb.Entity);
                var validationResults = Helper.ValidateEntities(toValidate);
                if (validationResults.Any())
                    throw new EntityValidationException(validationResults);
            }
            var affectedCount = _dbContext != null ? await _dbContext.SaveChangesAsync() : await ObjectContext.SaveChangesAsync();
            var generatedValues = GetGeneratedValues(mergeList);
            if (handledUnmappedList != null && handledUnmappedList.Any()) {
                var generatedValueList = generatedValues == null
                    ? new List<GeneratedValue>()
                    : generatedValues as List<GeneratedValue> ?? generatedValues.ToList();
                generatedValueList.AddRange(GetHandledUnmappedGeneratedValues(handledUnmappedList));
                generatedValues = generatedValueList;
            }

            var saveResult = new SaveResult(affectedCount, generatedValues, saveContext.GeneratedEntities, saveContext.UserData);
            OnAfterSaveChanges(new AfterSaveEventArgs(saveList, saveResult));

            return saveResult;
        }

        private EntitySetBase FindEntitySet(EdmType entityType) {
            while (entityType != null) {
                var set = EntitySets.FirstOrDefault(es => es.ElementType == entityType);
                if (set != null) return set;
                entityType = entityType.BaseType;
            }
            return null;
        }

        private EntitySetBase FindEntitySet(Type entityType) {
            while (entityType != null) {
                var set = EntitySets.FirstOrDefault(es => es.ElementType.Name == entityType.Name);
                if (set != null) return set;
                entityType = entityType.BaseType;
            }
            return null;
        }

        public string ModelNamespace => typeof(TContext).Namespace;

        public string ModelAssembly => typeof(TContext).Assembly.GetName().Name;
    }

    internal static class Lockers {
        internal static readonly object ObjectContextLocker = new object();
        internal static readonly object ItemCollectionLocker = new object();
        internal static readonly object ObjectItemCollectionLocker = new object();
        internal static readonly object MetadataLocker = new object();
    }
}