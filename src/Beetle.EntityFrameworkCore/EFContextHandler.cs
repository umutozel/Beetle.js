using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata;
using EFEntityState = Microsoft.EntityFrameworkCore.EntityState;

namespace Beetle.EntityFrameworkCore {
    using Meta;
    using Server;

    public class EFContextHandler<TContext> : ContextHandler<TContext> where TContext : DbContext {
        // ReSharper disable StaticMemberInGenericType
        // this behavior is exactly what we want: static instances for each TContext generic argument
        private static readonly object _entityTypesLocker = new object();
        private static readonly object _metadataLocker = new object();
        private static Metadata _metadata;
        private static IEnumerable<IEntityType> _entityTypes;
        // ReSharper restore StaticMemberInGenericType

        public EFContextHandler() {
        }

        public EFContextHandler(TContext context) : base(context) {
        }

        public bool ValidateOnSave { get; set; } = true;

        protected IEnumerable<IEntityType> EntityTypes {
            get {
                if (_entityTypes != null) return _entityTypes;
                lock (_entityTypesLocker) {
                    return _entityTypes ??
                           (_entityTypes = Context.Model.GetEntityTypes());
                }
            }
        }

        public override void Initialize() {
            base.Initialize();

            if (Context == null)
                throw new ArgumentNullException(nameof(Context));

            Context.Model.GetEntityTypes();
        }

        public override Metadata Metadata() {
            if (_metadata != null) return _metadata;
            lock (_metadataLocker) {
                return _metadata ?? 
                    (_metadata = MetadataGenerator.Generate(_entityTypes));
            }
        }

        public override object CreateType(string typeName) {
            var type = _entityTypes.FirstOrDefault(e => e.Name == typeName);
            if (type == null) throw new ArgumentException($"Cannot create instance of type '{typeName}'.");

            return Activator.CreateInstance(type.ClrType);
        }

        public IQueryable<TEntity> CreateQueryable<TEntity>() where TEntity: class {
            return Context.Set<TEntity>();
        }

        public virtual IList<EntityBag> MergeEntities(IEnumerable<EntityBag> entities, 
                                                      out IEnumerable<EntityBag> unmappedEntities) {
            if (entities == null)
                throw new ArgumentNullException(nameof(entities));

            var unmappeds = new List<EntityBag>();
            var entityList = entities as IList<EntityBag> ?? entities.ToList();
            var mergeList = new Dictionary<EntityEntry, EntityBag>();

            foreach (var entityBag in entityList) {
                var entity = entityBag.Entity;
                var entityType = EntityTypes.FirstOrDefault(et => et.ClrType.Name == entity.GetType().Name);

                if (entityType == null) {
                    unmappeds.Add(entityBag);
                    continue;
                }

                var state = entityBag.EntityState;

                // attach entity to entity set
                var entry = Context.Attach(entity);
                mergeList.Add(entry, entityBag);

                // set original values for modified entities
                if (state != EntityState.Modified) continue;

                var originalValues = entry.OriginalValues;
                foreach (var originalValue in entityBag.OriginalValues) {
                    originalValues[originalValue.Key] = originalValue.Value;
                }
            }

            foreach (var merge in mergeList) {
                // and fix the entity state, and relations will also be fixed.
                if (merge.Value.EntityState == EntityState.Modified) {
                    if (merge.Key.State != EFEntityState.Modified && merge.Value.ForceUpdate) {
                        merge.Key.State = EFEntityState.Modified;
                    }
                }
                else {
                    merge.Key.State = (EFEntityState) merge.Value.EntityState;
                }
            }

            unmappedEntities = unmappeds;
            return mergeList.Select(m => m.Value).ToList();
        }

        public override async Task<SaveResult> SaveChanges(SaveContext saveContext) {
            var merges = MergeEntities(saveContext.Entities, out IEnumerable<EntityBag> unmappeds);
            var mergeList = merges == null
                ? new List<EntityBag>()
                : merges as List<EntityBag> ?? merges.ToList();

            var saveList = mergeList;
            var handledUnmappeds = HandleUnmappeds(unmappeds);
            if (handledUnmappeds != null) {
                var mergedUnmappeds = MergeEntities(handledUnmappeds, out IEnumerable<EntityBag> _);
                saveList = saveList.Concat(mergedUnmappeds).ToList();
            }
            if (!saveList.Any()) return SaveResult.Empty;

            if (ValidateOnSave) {
                var validationResults = Server.Helper.ValidateEntities(saveList.Select(eb => eb.Entity));
                if (validationResults.Any())
                    throw new EntityValidationException(validationResults);
            }

            OnBeforeSaveChanges(new BeforeSaveEventArgs(saveContext));
            var affectedCount = await Context.SaveChangesAsync();
            var generatedValues = GetGeneratedValues(saveList);

            var saveResult = new SaveResult(
                affectedCount, generatedValues, 
                saveContext.GeneratedEntities, saveContext.UserData
            );
            OnAfterSaveChanges(new AfterSaveEventArgs(saveResult));

            return saveResult;
        }
    }
}