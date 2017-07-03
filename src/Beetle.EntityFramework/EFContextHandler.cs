using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;
using System.Data.Entity.Core.Objects;
using System.Data.Entity.Core.Metadata.Edm;
using System.Data.Entity.Infrastructure;
using EFEntityState = System.Data.Entity.EntityState;
using EFEntityType = System.Data.Entity.Core.Metadata.Edm.EntityType;

namespace Beetle.EntityFramework {
    using Meta;
    using Server;

    public class EFContextHandler<TContext> : ContextHandler<TContext> where TContext : DbContext {
        // ReSharper disable StaticMemberInGenericType
        private static Metadata _metadata;
        private static ItemCollection _itemCollection;
        private static IEnumerable<EFEntityType> _entityTypes;
        private static IEnumerable<EntitySetBase> _entitySets;
        private static ObjectItemCollection _objectItemCollection;
        private static List<EFEntityType> _objectEntityTypes;
        // ReSharper restore StaticMemberInGenericType
        private ObjectContext _objectContext;

        public EFContextHandler() {
        }

        public EFContextHandler(TContext context) : base(context) {
        }

        protected ItemCollection ItemCollection {
            get {
                if (_itemCollection != null) return _itemCollection;
                lock (Lockers.ItemCollectionLocker) {
                    return _itemCollection ??
                        (_itemCollection = _objectContext.MetadataWorkspace.GetItemCollection(DataSpace.CSpace));
                }
            }
        }

        protected IEnumerable<EFEntityType> EntityTypes {
            get {
                if (_entityTypes != null) return _entityTypes;
                lock (ItemCollection) {
                    return _entityTypes ??
                        (_entityTypes = ItemCollection.OfType<EFEntityType>().ToList());
                }
            }
        }

        protected IEnumerable<EntitySetBase> EntitySets {
            get {
                if (_entitySets != null) return _entitySets;
                lock (ItemCollection) {
                    return _entitySets ??
                        (_entitySets = ItemCollection.OfType<EntityContainer>().SelectMany(ec => ec.BaseEntitySets).ToList());
                }
            }
        }

        protected ObjectItemCollection ObjectItemCollection {
            get {
                if (_objectItemCollection != null) return _objectItemCollection;
                lock (Lockers.ObjectItemCollectionLocker) {
                    if (typeof(ObjectContext).IsAssignableFrom(typeof(TContext)))
                        _objectContext.MetadataWorkspace.LoadFromAssembly(_objectContext.GetType().Assembly);
                    return _objectItemCollection ??
                        (_objectItemCollection = (ObjectItemCollection)_objectContext.MetadataWorkspace.GetItemCollection(DataSpace.OSpace));
                }
            }
        }

        protected List<EFEntityType> ObjectEntityTypes {
            get {
                if (_objectEntityTypes != null) return _objectEntityTypes;
                lock (Lockers.ObjectEntityTypesLocker) {
                    if (_objectEntityTypes == null) {
                        var objectEntityTypes = ObjectItemCollection.GetItems<EFEntityType>();
                        _objectEntityTypes = objectEntityTypes?.ToList() ?? new List<EFEntityType>();
                    }
                    return _objectEntityTypes;
                }
            }
        }

        public override void Initialize() {
            base.Initialize();

            if (Context == null)
                throw new ArgumentNullException(nameof(Context));

            Context.Configuration.ProxyCreationEnabled = false;
            Context.Configuration.LazyLoadingEnabled = false;

            _objectContext = ((IObjectContextAdapter) Context).ObjectContext;
        }

        public override Metadata Metadata() {
            if (_metadata != null) return _metadata;
            lock (Lockers.MetadataLocker) {
                var a = typeof(TContext).Assembly;
                return _metadata ?? 
                    (_metadata = MetadataGenerator.Generate(_objectContext.MetadataWorkspace, 
                                                            ItemCollection, 
                                                            ObjectItemCollection, a));
            }
        }

        public override object CreateType(string typeName) {
            var oType = ObjectEntityTypes?.FirstOrDefault(x => x.Name == typeName);
            if (oType == null) return base.CreateType(typeName);

            var clrType = ObjectItemCollection.GetClrType(oType);
            return Activator.CreateInstance(clrType);
        }

        public IQueryable<TEntity> CreateQueryable<TEntity>() where TEntity: class {
            return Context.Set<TEntity>();
        }

        public virtual IList<EntityBag> MergeEntities(IEnumerable<EntityBag> entities, out IList<EntityBag> unmappedEntities) {
            if (entities == null)
                throw new ArgumentNullException(nameof(entities));

            var unmappeds = new List<EntityBag>();
            var entityList = entities as IList<EntityBag> ?? entities.ToList();
            var mergeList = new Dictionary<ObjectStateEntry, EntityBag>();

            foreach (var entityBag in entityList) {
                var entity = entityBag.Entity;
                var entityType = EntityTypes.FirstOrDefault(et => et.Name == entity.GetType().Name);
                EntitySetBase set = null;
                if (entityType != null) {
                    set = FindEntitySet(entityType);
                }

                if (set == null) {
                    unmappeds.Add(entityBag);
                    continue;
                }

                var state = entityBag.EntityState;

                // attach entity to entity set
                _objectContext.AddObject(set.Name, entity);
                var entry = _objectContext.ObjectStateManager.GetObjectStateEntry(entity);
                entry.ChangeState(EFEntityState.Unchanged);
                mergeList.Add(entry, entityBag);

                // set original values for modified entities
                if (state != EntityState.Modified) continue;

                var originalValues = entry.GetUpdatableOriginalValues();
                foreach (var originalValue in entityBag.OriginalValues) {
                    var propertyPaths = originalValue.Key.Split('.');

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
                            loopOriginalValues = (OriginalValueRecord)loopOriginalValues.GetValue(ordinal);
                            loopType = (StructuralType)property.TypeUsage.EdmType;
                        }
                        if (property == null) continue;

                        lastPropertyName = propertyPaths[propertyPaths.Length - 1];
                    }
                    else {
                        lastPropertyName = originalValue.Key;
                    }

                    property = loopType.Members.FirstOrDefault(p => p.Name == lastPropertyName);
                    if (property == null) continue;

                    // if modified property is a ComplexType then set all properties of ComplexType to modified.
                    if (property.TypeUsage.EdmType is ComplexType complexType) {
                        PopulateComplexType(loopOriginalValues, property.Name, originalValue.Value, complexType);
                    }
                    else {
                        var ordinal = loopOriginalValues.GetOrdinal(property.Name);
                        loopOriginalValues.SetValue(ordinal, originalValue.Value);
                    }
                }
            }

            foreach (var merge in mergeList) {
                // and fix the entity state, and relations will also be fixed.
                if (merge.Value.EntityState == EntityState.Modified) {
                    if (merge.Key.State != EFEntityState.Modified && merge.Value.ForceUpdate) {
                        merge.Key.ChangeState(EFEntityState.Modified);
                    }
                }
                else {
                    merge.Key.ChangeState((EFEntityState)merge.Value.EntityState);
                }
            }

            unmappedEntities = unmappeds;
            return mergeList.Select(m => m.Value).ToList();
        }

        private static void PopulateComplexType(OriginalValueRecord originalValues, string propertyName, object originalValue, ComplexType complexType) {
            var ordinal = originalValues.GetOrdinal(propertyName);
            originalValues = (OriginalValueRecord)originalValues.GetValue(ordinal);
            foreach (var cp in complexType.Properties) {
                var value = Server.Helper.GetMemberValue(originalValue, cp.Name);

                if (cp.TypeUsage.EdmType is ComplexType loopComplexType) {
                    PopulateComplexType(originalValues, cp.Name, value, loopComplexType);
                }
                else {
                    var loopOrdinal = originalValues.GetOrdinal(cp.Name);
                    originalValues.SetValue(loopOrdinal, value);
                }
            }
        }

        public override async Task<SaveResult> SaveChanges(SaveContext saveContext) {
            var merges = MergeEntities(saveContext.Entities, out IList<EntityBag> unmappeds);
            var mergeList = merges == null
                ? new List<EntityBag>()
                : merges as List<EntityBag> ?? merges.ToList();

            var saveList = mergeList;
            var handledUnmappeds = HandleUnmappeds(unmappeds);
            if (handledUnmappeds != null) {
                MergeEntities(handledUnmappeds, out IList<EntityBag> _);
                saveList = saveList.Concat(handledUnmappeds).ToList();
            }
            if (!saveList.Any()) return SaveResult.Empty;

            OnBeforeSaveChanges(new BeforeSaveEventArgs(saveContext));
            var affectedCount = await Context.SaveChangesAsync();
            var generatedValues = GetGeneratedValues(saveList);

            var saveResult = new SaveResult(affectedCount, generatedValues, saveContext.GeneratedEntities, saveContext.UserData);
            OnAfterSaveChanges(new AfterSaveEventArgs(saveResult));

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
    }

    internal static class Lockers {
        internal static readonly object ObjectContextLocker = new object();
        internal static readonly object ItemCollectionLocker = new object();
        internal static readonly object ObjectItemCollectionLocker = new object();
        internal static readonly object ObjectEntityTypesLocker = new object();
        internal static readonly object MetadataLocker = new object();
    }
}