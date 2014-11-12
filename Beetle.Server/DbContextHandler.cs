using Beetle.Server.Properties;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Linq.Dynamic;
using Beetle.Server.Meta;

namespace Beetle.Server {

    /// <summary>
    /// Base context handler class for database access. ORM context (manager etc.) proxy.
    /// Services use this class' implementors to handle data-metadata operations.
    /// Needed to be implemented for each used ORM.
    /// </summary>
    /// <typeparam name="TContext">The type of the context.</typeparam>
    public abstract class DbContextHandler<TContext> : DbContextHandler, IContextHandler<TContext> {

        /// <summary>
        /// Initializes a new instance of the <see cref="DbContextHandler{TContext}"/> class.
        /// </summary>
        protected DbContextHandler() {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="DbContextHandler{TContext}"/> class.
        /// </summary>
        /// <param name="context">The context.</param>
        protected DbContextHandler(TContext context) {
            Context = context;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="DbContextHandler{TContext}"/> class.
        /// </summary>
        /// <param name="queryableHandler">The queryable handler.</param>
        protected DbContextHandler(IQueryHandler<IQueryable> queryableHandler)
            : base(queryableHandler) {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="DbContextHandler{TContext}"/> class.
        /// </summary>
        /// <param name="context">The context.</param>
        /// <param name="queryableHandler">The queryable handler.</param>
        protected DbContextHandler(TContext context, IQueryHandler<IQueryable> queryableHandler)
            : base(queryableHandler) {
            Context = context;
        }

        /// <summary>
        /// Initializes this instance.
        /// </summary>
        public override void Initialize() {
            if (Equals(Context, default(TContext)))
                Context = CreateContext();
        }

        /// <summary>
        /// Creates the context.
        /// </summary>
        /// <returns></returns>
        public virtual TContext CreateContext() {
            return Activator.CreateInstance<TContext>();
        }

        /// <summary>
        /// Gets the entity framework context.
        /// </summary>
        /// <value>
        /// The context.
        /// </value>
        public TContext Context { get; private set; }
    }

    /// <summary>
    /// Base context handler class for database access. ORM context (manager etc.) proxy.
    /// Services use this class' implementors to handle data-metadata operations.
    /// Needed to be implemented for each used ORM.
    /// </summary>
    public abstract class DbContextHandler : ContextHandler {
        private readonly object _metadataLocker = new object();
        private static readonly Dictionary<string, Metadata> _metadataCache = new Dictionary<string, Metadata>();

        /// <summary>
        /// Initializes a new instance of the <see cref="DbContextHandler"/> class.
        /// </summary>
        protected DbContextHandler() {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="DbContextHandler"/> class.
        /// </summary>
        /// <param name="queryableHandler">The queryable handler.</param>
        protected DbContextHandler(IQueryHandler<IQueryable> queryableHandler)
            : base(queryableHandler) {
        }

        /// <summary>
        /// Return metadata about data structure.
        /// </summary>
        /// <returns>
        /// Metadata object.
        /// </returns>
        public override Metadata Metadata() {
            if (_metadataCache.ContainsKey(Connection.ConnectionString))
                return _metadataCache[Connection.ConnectionString];

            lock (_metadataLocker) {
                if (_metadataCache.ContainsKey(Connection.ConnectionString))
                    return _metadataCache[Connection.ConnectionString];

                var metadata = Helper.GetMetadata(Connection, ModelNamespace, ModelAssembly);
                _metadataCache.Add(Connection.ConnectionString, metadata);

                return metadata;
            }
        }

        /// <summary>
        /// Handles the unknown action.
        /// </summary>
        /// <param name="action">The action.</param>
        /// <returns></returns>
        public override object HandleUnknownAction(string action) {
            Type type = null;
            var metadata = Metadata();
            var plural = Helper.Pluralize(action);
            var singular = Helper.Singularize(action);
            var entityType = metadata.Entities.FirstOrDefault(e => e.ShortName == action || e.ShortName == singular) ??
                             metadata.Entities.FirstOrDefault(e => e.QueryName == action || e.QueryName == plural);

            if (entityType != null)
                type = entityType.ClrType;
            if (type == null)
                type = Type.GetType(string.Format("{0}.{1}, {2}", ModelNamespace, singular, ModelAssembly));

            if (type == null)
                throw new BeetleException(string.Format(Resources.CannotFindTypeInformation, singular));

            return GetType().GetMethod("CreateQueryable").MakeGenericMethod(type).Invoke(this, null);
        }

        /// <summary>
        /// Creates the queryable.
        /// </summary>
        /// <returns></returns>
        public virtual IQueryable<T> CreateQueryable<T>() where T : class {
            throw new NotImplementedException(); // todo: implement beetle queryable
        }

        /// <summary>
        /// Merges the entities.
        /// </summary>
        /// <param name="entityBags">The entity bags.</param>
        /// <param name="unmappedEntities">The unmapped entities.</param>
        /// <returns></returns>
        public virtual IEnumerable<EntityBag> MergeEntities(IEnumerable<EntityBag> entityBags, out IEnumerable<EntityBag> unmappedEntities) {
            return MergeEntitiesBase(entityBags, out unmappedEntities);
        }

        /// <summary>
        /// Merges the entities, fixes relations and sort entities for save operation.
        /// </summary>
        /// <param name="entityBags">The entity bags.</param>
        /// <param name="unmappedEntities">The unmapped entities.</param>
        /// <returns></returns>
        protected IEnumerable<EntityBag> MergeEntitiesBase(IEnumerable<EntityBag> entityBags, out IEnumerable<EntityBag> unmappedEntities) {
            if (entityBags == null)
                throw new ArgumentNullException("entityBags");

            var entityBagList = entityBags as IList<EntityBag> ?? entityBags.ToList();
            var entityList = entityBagList.Select(eb => eb.Entity).ToList();
            var mergedBagList = entityBagList.ToList();
            var unmappedEntityList = new List<EntityBag>();
            var metadata = Metadata();

            foreach (var entityBag in entityBagList) {
                var entity = entityBag.Entity;
                var type = entity.GetType();
                var entityTypeName = string.Format("{0}, {1}", type.FullName, type.Assembly.GetName().Name);
                var entityType = metadata.Entities.FirstOrDefault(e => e.Name == entityTypeName);
                entityBag.EntityType = entityType;
                if (entityType == null) {
                    unmappedEntityList.Add(entityBag);
                    mergedBagList.Remove(entityBag);
                    continue;
                }

                foreach (var metaNavigation in entityType.AllNavigationProperties) {
                    var navigationType = Helper.GetPropertyType(type, metaNavigation.Name);
                    if (navigationType == null) continue;
                    var metaInverseNavigation = metaNavigation.Inverse;
                    if (metaNavigation.IsScalar.HasValue && metaNavigation.IsScalar.Value) {
                        if (!metaNavigation.ForeignKeys.Any()) continue;

                        var navigationQuery = GetRelationQuery(entityList, entity, navigationType, entityType.Keys, metaNavigation.ForeignKeys);
                        if (navigationQuery == null) continue;

                        var navigationEntity = Enumerable.SingleOrDefault((dynamic)navigationQuery);
                        if (navigationEntity == null) continue;

                        var navigationEntityBag = entityBagList.Single(eb => eb.Entity == navigationEntity);
                        if (navigationEntityBag.EntityState == EntityState.Added) {
                            var navigationEntityBagIndex = mergedBagList.IndexOf(navigationEntityBag);
                            var entityBagIndex = mergedBagList.IndexOf(entityBag);
                            if (navigationEntityBagIndex > entityBagIndex) {
                                mergedBagList.Remove(navigationEntityBag);
                                mergedBagList.Insert(entityBagIndex, navigationEntityBag);
                            }
                        }

                        Helper.SetPropertyValue(entity, metaNavigation.Name, navigationEntity);

                        if (metaInverseNavigation == null) continue;

                        var inverseNavigationPropertyType = Helper.GetPropertyType(navigationType, metaInverseNavigation.Name);
                        if (inverseNavigationPropertyType == null) continue;

                        if (metaInverseNavigation.IsScalar.HasValue && metaInverseNavigation.IsScalar.Value) {
                            Helper.SetPropertyValue(navigationEntity, metaInverseNavigation.Name, entity);
                        }
                        else {
                            var inverseValue = Helper.GetPropertyValue(navigationEntity, metaInverseNavigation.Name);
                            if (inverseValue == null && !inverseNavigationPropertyType.IsInterface) {
                                inverseValue = Activator.CreateInstance(inverseNavigationPropertyType);
                                Helper.SetPropertyValue(navigationEntity, metaInverseNavigation.Name, inverseValue);
                            }
                            if (inverseValue != null && !Enumerable.Contains(inverseValue, entity)) {
                                var addMethod = inverseValue.GetType().GetMethod("Add");
                                addMethod.Invoke(inverseValue, new[] { entity });
                            }
                        }
                    }
                    else if (metaInverseNavigation != null) {
                        if (!navigationType.IsGenericType) continue;
                        var navigationValue = Helper.GetPropertyValue(entity, metaNavigation.Name);
                        if (navigationValue == null && !navigationType.IsInterface) {
                            navigationValue = Activator.CreateInstance(navigationType);
                            Helper.SetPropertyValue(entity, metaNavigation.Name, navigationValue);
                        }
                        if (navigationValue == null) continue;

                        var navigationQuery = GetRelationQuery(entityList, entity, navigationType.GenericTypeArguments.Single(),
                                                               metaInverseNavigation.ForeignKeys, entityType.Keys);
                        if (navigationQuery == null) continue;

                        var navigationEntities = Enumerable.ToList((dynamic)navigationQuery);
                        var addMethod = navigationValue.GetType().GetMethod("Add");
                        foreach (var navigationEntity in navigationEntities) {
                            if (!Enumerable.Contains(navigationValue, navigationEntity))
                                addMethod.Invoke(navigationValue, new object[] { navigationEntity });
                        }
                    }
                }
            }

            unmappedEntities = unmappedEntityList;
            return mergedBagList;
        }

        /// <summary>
        /// Gets the relation query.
        /// </summary>
        /// <param name="entities">The entities.</param>
        /// <param name="keyEntity">The key entity.</param>
        /// <param name="relationType">Type of the relation.</param>
        /// <param name="keys">The keys.</param>
        /// <param name="foreignKeys">The foreign keys.</param>
        /// <returns></returns>
        private static IQueryable GetRelationQuery(IEnumerable entities, object keyEntity, Type relationType, IReadOnlyList<string> keys, IReadOnlyList<string> foreignKeys) {
            if (keys.Count != foreignKeys.Count) return null;

            const string filter = "{0} == @{1}";
            var ofTypeMethod = typeof(Queryable).GetMethod("OfType");
            var navigationQuery = ofTypeMethod.MakeGenericMethod(relationType).Invoke(null, new object[] { entities.AsQueryable() }) as IQueryable;
            var filters = new List<string>();
            var parameters = new List<object>();

            for (var i = 0; i < foreignKeys.Count; i++) {
                var keyName = keys[i];
                var foreignKeyName = foreignKeys[i];
                var foreignKeyValue = Helper.GetPropertyValue(keyEntity, foreignKeyName);
                if (foreignKeyValue == null) return null;

                filters.Add(string.Format(filter, keyName, i));
                parameters.Add(foreignKeyValue);
            }

            return navigationQuery.Where(string.Join(" && ", filters), parameters.ToArray());
        }

        /// <summary>
        /// Saves the changes.
        /// </summary>
        /// <param name="entities">The entities.</param>
        /// <param name="saveContext">The save context.</param>
        /// <returns>
        /// Save result.
        /// </returns>
        public override SaveResult SaveChanges(IEnumerable<EntityBag> entities, SaveContext saveContext) {
            return SaveChangesBase(entities, saveContext);
        }

        /// <summary>
        /// Saves the changes directly using SQL queries.
        /// </summary>
        /// <param name="entityBags">The entity bags.</param>
        /// <param name="saveContext">The save context.</param>
        /// <returns></returns>
        /// <exception cref="EntityValidationException"></exception>
        protected SaveResult SaveChangesBase(IEnumerable<EntityBag> entityBags, SaveContext saveContext) {
            IEnumerable<EntityBag> unmappeds;
            var merges = MergeEntitiesBase(entityBags, out unmappeds);
            var mergeList = merges == null
                ? new List<EntityBag>()
                : merges as List<EntityBag> ?? merges.ToList();

            var saveList = mergeList;
            var handledUnmappeds = HandleUnmappeds(unmappeds);
            var handledUnmappedList = handledUnmappeds == null ? null : handledUnmappeds as IList<EntityBag> ?? handledUnmappeds.ToList();
            if (handledUnmappedList != null && handledUnmappedList.Any()) {
                IEnumerable<EntityBag> discarded;
                MergeEntitiesBase(handledUnmappedList, out discarded);
                saveList = saveList.Concat(handledUnmappedList).ToList();
            }
            if (!saveList.Any()) return SaveResult.Empty;

            OnBeforeSaveChanges(new BeforeSaveEventArgs(saveList, saveContext));
            // do data annotation validations
            if (ValidateOnSaveEnabled) {
                var toValidate = saveList.Where(eb => eb.EntityState == EntityState.Added || eb.EntityState == EntityState.Modified).Select(eb => eb.Entity);
                var validationResults = Helper.ValidateEntities(toValidate);
                if (validationResults.Any())
                    throw new EntityValidationException(validationResults);
            }

            var connectionState = Connection.State;
            if (Connection.State != ConnectionState.Open)
                Connection.Open();

            var affectedCount = 0;
            // we save all entities in one transaction
            using (var transaction = Connection.BeginTransaction()) {
                try {
                    for (var i = 0; i < saveList.Count; i++) {
                        var entityBag = saveList[i];

                        if (entityBag.EntityState != EntityState.Detached && entityBag.EntityState != EntityState.Unchanged) {
                            // get auto generated keys and values
                            var generatedKeys = new List<GeneratedValue>();
                            var entity = entityBag.Entity;
                            var entityType = entityBag.EntityType;

                            if (entityBag.EntityState != EntityState.Deleted) {
                                // find generated properties for this entity
                                for (var j = 0; j < entityType.KeyProperties.Count; j++) {
                                    var keyProperty = entityType.KeyProperties[j];
                                    if (keyProperty.GenerationPattern != GenerationPattern.None)
                                        generatedKeys.Add(new GeneratedValue(j, keyProperty.Name, Helper.GetPropertyValue(entity, keyProperty.Name)));
                                }
                            }

                            affectedCount += SaveEntityBag(entityBag, transaction);

                            if (!generatedKeys.Any()) continue;

                            // browse all entities
                            for (var j = i; j < saveList.Count; j++) {
                                var relatedEntityBag = saveList[j];
                                var relatedEntity = relatedEntityBag.Entity;

                                // find references to saved entity
                                var navigationProperties = relatedEntityBag.EntityType.NavigationProperties
                                    .Where(x => x.EntityType == entityType && x.ForeignKeys.Any())
                                    .ToList();
                                // if there is none, skip it
                                if (!navigationProperties.Any()) continue;

                                // browse all navigation properties with type of saved entity
                                foreach (var navigationProperty in navigationProperties) {
                                    // set all generated values to this referencing entity's foreign keys
                                    foreach (var generatedKey in generatedKeys) {
                                        var foreignKeyName = navigationProperty.ForeignKeys[generatedKey.Index];
                                        var foreignKeyValue = Helper.GetPropertyValue(relatedEntity, foreignKeyName);
                                        if (foreignKeyValue.Equals(generatedKey.Value)) {
                                            var keyValue = Helper.GetPropertyValue(entity, generatedKey.Property);
                                            Helper.SetPropertyValue(relatedEntity, foreignKeyName, keyValue);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    transaction.Commit();
                }
                catch {
                    transaction.Rollback();
                    throw;
                }
                finally {
                    if (connectionState == ConnectionState.Closed)
                        Connection.Close();
                }
            }

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

        /// <summary>
        /// Saves the entity bag.
        /// </summary>
        /// <param name="entityBag">The entity bag.</param>
        /// <param name="transaction">The transaction.</param>
        /// <returns>
        /// Affected count
        /// </returns>
        /// <exception cref="System.ArgumentNullException">entityBag</exception>
        /// <exception cref="System.InvalidOperationException">Cannot save entity with state  + entityBag.EntityState</exception>
        protected virtual int SaveEntityBag(EntityBag entityBag, IDbTransaction transaction = null) {
            if (entityBag == null)
                throw new ArgumentNullException("entityBag");

            switch (entityBag.EntityState) {
                case EntityState.Added:
                    return InsertEntity(entityBag.Entity, entityBag.EntityType, transaction);
                case EntityState.Modified:
                    return UpdateEntity(entityBag.Entity, entityBag.OriginalValues.Select(ov => ov.Key),
                                        entityBag.ForceUpdate, entityBag.EntityType, transaction);
                case EntityState.Deleted:
                    return DeleteEntity(entityBag.Entity, entityBag.EntityType, transaction);
                default:
                    throw new InvalidOperationException(string.Format(Resources.CannotSaveEntityWithState, entityBag.EntityState));
            }
        }

        /// <summary>
        /// Inserts the entity.
        /// </summary>
        /// <param name="entity">The entity.</param>
        /// <param name="entityType">Type of the entity.</param>
        /// <param name="transaction">The transaction.</param>
        /// <returns>
        /// Affected count
        /// </returns>
        /// <exception cref="BeetleException">Insert operation should not affect more than one record.</exception>
        protected virtual int InsertEntity(object entity, EntityType entityType = null, IDbTransaction transaction = null) {
            var affectedCount = 0;
            entityType = GetEntityType(entity, entityType);
            var dataProperties = entityType.DataProperties.ToList();
            // if entity has base type, first save it.
            if (entityType.BaseType != null) {
                dataProperties.AddRange(entityType.KeyProperties);
                affectedCount += InsertEntity(entity, entityType.BaseType, transaction);
            }

            var columns = new List<string>();
            var valueParameters = new Dictionary<string, object>();
            var computedColumns = new Dictionary<DataProperty, object>();

            // get all columns and values to save
            foreach (var dataProperty in dataProperties) {
                if (dataProperty.GenerationPattern == GenerationPattern.None) {
                    columns.Add(EscapeSqlIdentifier(DbType, dataProperty.ColumnName));
                    var value = Helper.GetPropertyValue(entity, dataProperty.Name);
                    valueParameters.Add("@" + dataProperty.ColumnName, value);
                }
                else
                    computedColumns.Add(dataProperty, entity);
            }
            PopulateComplexProperties(entity, entityType, columns, valueParameters, computedColumns, true);

            var tableName = EscapeSqlIdentifier(DbType, entityType.TableName);
            // prepare SQL for insert
            var insertSql = string.Format("insert into {0} ({1}) values ({2})",
                                           tableName,
                                           string.Join(", ", columns),
                                           string.Join(", ", valueParameters.Select(v => v.Key)));

            var connectionState = Connection.State;
            if (Connection.State != ConnectionState.Open)
                Connection.Open();

            // insert the record
            using (var insertCommand = Connection.CreateCommand()) {
                if (transaction != null)
                    insertCommand.Transaction = transaction;
                insertCommand.CommandText = insertSql;
                AddCommandParameters(insertCommand, valueParameters);
                if (insertCommand.ExecuteNonQuery() != 1)
                    throw new BeetleException(Resources.InsertAffectedUnexpectedNumberOfRows);
            }

            // if there is computed or identity columns, get their generated values
            if (computedColumns.Any()) {
                IEnumerable<string> keyFilters;
                IDictionary<string, object> keyParameters;
                // get key columns and values
                PopulateKeyFilters(entity, entityType, true, out keyFilters, out keyParameters);
                PopulateComputedValues(tableName, computedColumns, keyFilters, keyParameters, transaction);
            }

            if (connectionState == ConnectionState.Closed)
                Connection.Close();

            return ++affectedCount;
        }

        /// <summary>
        /// Updates the entity.
        /// </summary>
        /// <param name="entity">The entity.</param>
        /// <param name="modifiedProperties">The modified properties.</param>
        /// <param name="forceUpdate">if set to <c>true</c> [force update].</param>
        /// <param name="entityType">Type of the entity.</param>
        /// <param name="transaction">The transaction.</param>
        /// <returns>
        /// Affected count
        /// </returns>
        /// <exception cref="BeetleException">Update operation should not affect more than one record.</exception>
        protected virtual int UpdateEntity(object entity, IEnumerable<string> modifiedProperties = null, bool forceUpdate = false,
                                           EntityType entityType = null, IDbTransaction transaction = null) {
            var affectedCount = 0;
            entityType = GetEntityType(entity, entityType);
            // if entity has base type, first save it.
            var modifiedPropertyList = modifiedProperties == null
                ? null
                : (modifiedProperties as IList<string> ?? modifiedProperties.ToList());

            // if force update is disabled and there is no modified property, do nothing.
            if (!forceUpdate && (modifiedPropertyList == null || !modifiedPropertyList.Any())) return affectedCount;
            if (entityType.BaseType != null)
                affectedCount += UpdateEntity(entity, modifiedPropertyList, forceUpdate, entityType.BaseType, transaction);

            var columns = new List<string>();
            var valueParameters = new Dictionary<string, object>();
            var computedColumns = new Dictionary<DataProperty, object>();

            // get values to save
            if ((modifiedPropertyList == null || !modifiedPropertyList.Any()) && forceUpdate) {
                modifiedPropertyList = entityType.DataProperties.Select(dp => dp.Name).ToList();
                PopulateComplexProperties(entity, entityType, columns, valueParameters, computedColumns, false);
            }

            foreach (var modifiedProperty in modifiedPropertyList) {
                var modifiedPropertyPaths = modifiedProperty.Split('.');
                var lastPropertyName = modifiedProperty;
                string lastColumnName = null;
                var loopEntity = entity;
                var loopEntityType = entityType;
                if (modifiedPropertyPaths.Length > 1) {
                    ComplexProperty loopComplexProperty = null;
                    for (var i = 0; i < modifiedPropertyPaths.Length - 1; i++) {
                        var complexPropertyName = modifiedPropertyPaths[i];
                        loopComplexProperty = loopEntityType.ComplexProperties.FirstOrDefault(cp => cp.Name == complexPropertyName);
                        if (loopComplexProperty == null) break;

                        loopEntity = Helper.GetPropertyValue(loopEntity, complexPropertyName);
                        loopEntityType = loopComplexProperty.ComplexType;
                    }
                    if (loopComplexProperty == null) continue;

                    lastPropertyName = modifiedPropertyPaths[modifiedPropertyPaths.Length - 1];
                    // use ComplexProperty ColumnName mapping for ComplexTypes
                    var mapping = loopComplexProperty.Mappings.FirstOrDefault(m => m.PropertyName == lastPropertyName);
                    if (mapping != null)
                        lastColumnName = mapping.ColumnName;
                }

                // if modified property is ComplexProperty, then consider all properties of ComplexType as modified
                var complexProperty = loopEntityType.ComplexProperties.FirstOrDefault(cp => cp.Name == lastPropertyName);
                if (complexProperty != null)
                    PopulateComplexType(loopEntity, complexProperty, columns, valueParameters, computedColumns, false);
                else {
                    var dataProperty = loopEntityType.DataProperties.FirstOrDefault(dp => dp.Name == lastPropertyName);
                    if (dataProperty == null || entityType.KeyProperties.Contains(dataProperty)) continue;

                    // if it is not from a ComplexType property, use DataProperty ColumnName
                    if (lastColumnName == null)
                        lastColumnName = dataProperty.ColumnName;

                    var valuePrm = "@" + lastColumnName;
                    if (valueParameters.ContainsKey(valuePrm)) continue;

                    if (dataProperty.GenerationPattern == GenerationPattern.None) {
                        columns.Add(string.Format("{0} = @{1}", EscapeSqlIdentifier(DbType, lastColumnName), lastColumnName));
                        var value = Helper.GetPropertyValue(loopEntity, dataProperty.Name);
                        valueParameters.Add(valuePrm, value);
                    }
                    else if (dataProperty.GenerationPattern == GenerationPattern.Computed && !computedColumns.ContainsKey(dataProperty))
                        computedColumns.Add(dataProperty, loopEntity);
                }
            }

            IEnumerable<string> concurrencyFilters;
            IDictionary<string, object> concurrencyParameters;
            PopulateConcurrencyFilters(entity, entityType, out concurrencyFilters, out concurrencyParameters);
            var concurrencyFilterList = concurrencyFilters == null
                ? null
                : concurrencyFilters as IList<string> ?? concurrencyFilters.ToList();
            if (valueParameters.Count == 0 && (concurrencyFilterList == null || !concurrencyFilterList.Any()))
                return affectedCount;

            IEnumerable<string> keyFilters;
            IDictionary<string, object> keyParameters;
            // get key columns and values
            PopulateKeyFilters(entity, entityType, false, out keyFilters, out keyParameters);
            var keyFilterList = keyFilters as IList<string> ?? keyFilters.ToList();

            var tableName = EscapeSqlIdentifier(DbType, entityType.TableName);

            var connectionState = Connection.State;
            if (Connection.State != ConnectionState.Open)
                Connection.Open();

            if (valueParameters.Any()) {
                // prepare SQL for update
                var updateSql = string.Format("update {0} set {1} where {2}",
                    tableName,
                    string.Join(", ", columns),
                    string.Join(" and ", concurrencyFilterList == null ? keyFilterList : keyFilterList.Union(concurrencyFilterList)));

                // update the record
                using (var updateCommand = Connection.CreateCommand()) {
                    if (transaction != null)
                        updateCommand.Transaction = transaction;
                    updateCommand.CommandText = updateSql;
                    AddCommandParameters(updateCommand, valueParameters);
                    AddCommandParameters(updateCommand, keyParameters.Union(concurrencyParameters));
                    if (updateCommand.ExecuteNonQuery() != 1)
                        throw new BeetleException(Resources.UpdateAffectedUnexpectedNumberOfRows);
                }
            }

            // if there is computed or identity columns, get their generated values
            if (computedColumns.Any())
                PopulateComputedValues(tableName, computedColumns, keyFilterList, keyParameters, transaction);

            if (connectionState == ConnectionState.Closed)
                Connection.Close();

            return ++affectedCount;
        }

        /// <summary>
        /// Deletes the entity.
        /// </summary>
        /// <param name="entity">The entity.</param>
        /// <param name="entityType">Type of the entity.</param>
        /// <param name="transaction">The transaction.</param>
        /// <returns>
        /// Affected count
        /// </returns>
        /// <exception cref="BeetleException">Delete operation should not affect more than one record.</exception>
        protected virtual int DeleteEntity(object entity, EntityType entityType = null, IDbTransaction transaction = null) {
            var affectedCount = 0;
            entityType = GetEntityType(entity, entityType);

            IEnumerable<string> keyFilters;
            IDictionary<string, object> keyParameters;
            PopulateKeyFilters(entity, entityType, false, out keyFilters, out keyParameters);

            var tableName = EscapeSqlIdentifier(DbType, entityType.TableName);
            // prepare SQL for update
            var deleteSql = string.Format("delete from {0} where {1}",
                                           tableName,
                                           string.Join(" and ", keyFilters));

            var connectionState = Connection.State;
            if (Connection.State != ConnectionState.Open)
                Connection.Open();

            // update the record
            using (var deleteCommand = Connection.CreateCommand()) {
                if (transaction != null)
                    deleteCommand.Transaction = transaction;
                deleteCommand.CommandText = deleteSql;
                AddCommandParameters(deleteCommand, keyParameters);
                if (deleteCommand.ExecuteNonQuery() != 1)
                    throw new BeetleException(Resources.DeleteAffectedUnexpectedNumberOfRows);
            }

            if (connectionState == ConnectionState.Closed)
                Connection.Close();

            if (entityType.BaseType != null)
                affectedCount += DeleteEntity(entity, entityType.BaseType, transaction);

            return ++affectedCount;
        }

        /// <summary>
        /// Populates the complex properties to value parameters for SQL Insert.
        /// </summary>
        /// <param name="entity">The entity.</param>
        /// <param name="entityType">Type of the entity.</param>
        /// <param name="columns">The columns.</param>
        /// <param name="valueParameters">The value parameters.</param>
        /// <param name="computedColumns">The computed columns.</param>
        /// <param name="forInsert">if set to <c>true</c> [for insert].</param>
        private void PopulateComplexProperties(object entity, EntityType entityType,
                                               ICollection<string> columns,
                                               IDictionary<string, object> valueParameters,
                                               IDictionary<DataProperty, object> computedColumns,
                                               bool forInsert) {
            foreach (var complexProperty in entityType.ComplexProperties)
                PopulateComplexType(entity, complexProperty, columns, valueParameters, computedColumns, forInsert);
        }

        /// <summary>
        /// Populates complex type properties to command parameters.
        /// </summary>
        /// <param name="entity">The entity.</param>
        /// <param name="complexProperty">The complex property.</param>
        /// <param name="columns">The columns.</param>
        /// <param name="valueParameters">The value parameters.</param>
        /// <param name="computedColumns">The computed columns.</param>
        /// <param name="forInsert">if set to <c>true</c> [for insert].</param>
        private void PopulateComplexType(object entity, ComplexProperty complexProperty,
                                         ICollection<string> columns,
                                         IDictionary<string, object> valueParameters,
                                         IDictionary<DataProperty, object> computedColumns,
                                         bool forInsert) {
            var complexValue = Helper.GetPropertyValue(entity, complexProperty.Name);
            foreach (var dataProperty in complexProperty.ComplexType.DataProperties) {
                if (dataProperty.GenerationPattern == GenerationPattern.None) {
                    var mapping = complexProperty.Mappings.FirstOrDefault(m => m.PropertyName == dataProperty.Name);
                    var columnName = mapping == null ? dataProperty.ColumnName : mapping.ColumnName;
                    var valuePrm = "@" + columnName;
                    if (valueParameters.ContainsKey(valuePrm)) continue;

                    columns.Add(forInsert
                        ? EscapeSqlIdentifier(DbType, columnName)
                        : string.Format("{0} = @{1}", EscapeSqlIdentifier(DbType, columnName), columnName));
                    var value = Helper.GetPropertyValue(complexValue, dataProperty.Name);
                    valueParameters.Add(valuePrm, value);
                }
                else if (!computedColumns.ContainsKey(dataProperty))
                    computedColumns.Add(dataProperty, complexValue);
            }
            PopulateComplexProperties(complexValue, complexProperty.ComplexType, columns, valueParameters, computedColumns, forInsert);
        }

        /// <summary>
        /// Populates the computed values.
        /// </summary>
        /// <param name="tableName">Name of the table.</param>
        /// <param name="computedColumns">The computed columns.</param>
        /// <param name="keyFilters">The key filters.</param>
        /// <param name="keyParameters">The key parameters.</param>
        /// <param name="transaction">The transaction.</param>
        private void PopulateComputedValues(string tableName, IDictionary<DataProperty, object> computedColumns, IEnumerable<string> keyFilters,
                                            IEnumerable<KeyValuePair<string, object>> keyParameters, IDbTransaction transaction) {
            // if there is computed or identity columns, get their generated values
            if (computedColumns.Any()) {
                var selectSql = string.Format("select {0} from {1} where {2}",
                                               string.Join(", ", computedColumns.Select(dp => EscapeSqlIdentifier(DbType, dp.Key.ColumnName))),
                                               tableName,
                                               string.Join(" and ", keyFilters));
                // read generated values
                using (var selectCommand = Connection.CreateCommand()) {
                    if (transaction != null)
                        selectCommand.Transaction = transaction;
                    selectCommand.CommandText = selectSql;
                    AddCommandParameters(selectCommand, keyParameters);
                    using (var reader = selectCommand.ExecuteReader()) {
                        if (reader.Read()) {
                            foreach (var computedColumn in computedColumns) {
                                var value = reader[computedColumn.Key.ColumnName];
                                if (value == DBNull.Value) value = null;
                                Helper.SetPropertyValue(computedColumn.Value, computedColumn.Key.Name, value);
                            }
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Populates the key properties.
        /// </summary>
        /// <param name="entity">The entity.</param>
        /// <param name="entityType">Type of the entity.</param>
        /// <param name="isInsert">if set to <c>true</c> [is insert].</param>
        /// <param name="keyFilters">The key filters.</param>
        /// <param name="keyParameters">The key parameters.</param>
        /// <param name="ownerProperty">The owner property.</param>
        /// <exception cref="BeetleException">Cannot find any key for  + entityType.ShortName</exception>
        private void PopulateKeyFilters(object entity, EntityType entityType, bool isInsert,
                                        out IEnumerable<string> keyFilters, out IDictionary<string, object> keyParameters,
                                        ComplexProperty ownerProperty = null) {
            if (!(entityType.IsComplexType ?? false) && !entityType.KeyProperties.Any())
                throw new BeetleException(string.Format(Resources.CannotFindAnyKey, entityType.ShortName));

            var kf = new List<string>();
            var kp = new Dictionary<string, object>();

            foreach (var keyProperty in entityType.KeyProperties)
                PopulateKeyFilter(entity, keyProperty, isInsert, kf, kp, ownerProperty);

            foreach (var complexProperty in entityType.ComplexProperties) {
                var complexValue = Helper.GetPropertyValue(entity, complexProperty.Name);
                var complexType = complexProperty.ComplexType;
                IEnumerable<string> complexKeyFilters;
                IDictionary<string, object> complexKeyParameters;
                PopulateKeyFilters(complexValue, complexType, isInsert, out complexKeyFilters, out complexKeyParameters, complexProperty);
                kf.AddRange(complexKeyFilters);
                foreach (var complexKeyParameter in complexKeyParameters)
                    kp.Add(complexKeyParameter.Key, complexKeyParameter.Value);
            }

            keyFilters = kf;
            keyParameters = kp;
        }

        private void PopulateConcurrencyFilters(object entity, EntityType entityType,
                                                out IEnumerable<string> keyFilters, out IDictionary<string, object> keyParameters,
                                                ComplexProperty ownerProperty = null) {
            var kf = new List<string>();
            var kp = new Dictionary<string, object>();

            foreach (var dataProperty in entityType.DataProperties.Where(dataProperty => dataProperty.UseForConcurrency.HasValue && dataProperty.UseForConcurrency.Value))
                PopulateKeyFilter(entity, dataProperty, false, kf, kp, ownerProperty);

            foreach (var complexProperty in entityType.ComplexProperties) {
                var complexValue = Helper.GetPropertyValue(entity, complexProperty.Name);
                var complexType = complexProperty.ComplexType;
                IEnumerable<string> complexKeyFilters;
                IDictionary<string, object> complexKeyParameters;
                PopulateConcurrencyFilters(complexValue, complexType, out complexKeyFilters, out complexKeyParameters, complexProperty);
                kf.AddRange(complexKeyFilters);
                foreach (var complexKeyParameter in complexKeyParameters) {
                    kp.Add(complexKeyParameter.Key, complexKeyParameter.Value);
                }
            }

            keyFilters = kf;
            keyParameters = kp;
        }

        /// <summary>
        /// Populates the key filter.
        /// </summary>
        /// <param name="entity">The entity.</param>
        /// <param name="keyProperty">The key property.</param>
        /// <param name="isInsert">if set to <c>true</c> [is insert].</param>
        /// <param name="kp">The key parameters.</param>
        /// <param name="kf">The key filters.</param>
        /// <param name="ownerProperty">The owner property.</param>
        private void PopulateKeyFilter(object entity, DataProperty keyProperty, bool isInsert,
                                       ICollection<string> kf, IDictionary<string, object> kp,
                                       ComplexProperty ownerProperty = null) {
            string keyFilter;
            string columnName = null;

            if (ownerProperty != null) {
                var mapping = ownerProperty.Mappings.FirstOrDefault(m => m.PropertyName == keyProperty.Name);
                if (mapping != null)
                    columnName = mapping.ColumnName;
            }
            if (columnName == null)
                columnName = keyProperty.Name;

            if (isInsert && keyProperty.GenerationPattern == GenerationPattern.Identity)
                keyFilter = EscapeSqlIdentifier(DbType, columnName) + " = " + GetIdentitySelectSql(DbType);
            else {
                keyFilter = EscapeSqlIdentifier(DbType, columnName) + " = @" + columnName;
                var keyValue = Helper.GetPropertyValue(entity, keyProperty.Name);
                kp.Add("@" + columnName, keyValue);
            }

            kf.Add(keyFilter);
        }

        /// <summary>
        /// Checks arguments and gets the metadata type of the entity.
        /// </summary>
        /// <param name="entity">The entity.</param>
        /// <param name="entityType">Type of the entity.</param>
        /// <returns></returns>
        /// <exception cref="System.ArgumentNullException">entity</exception>
        /// <exception cref="BeetleException">Entity type cannot be found for  + entityTypeName</exception>
        private EntityType GetEntityType(object entity, EntityType entityType) {
            if (entity == null) throw new ArgumentNullException("entity");
            if (entityType != null) return entityType;

            var type = entity.GetType();
            var entityTypeName = string.Format("{0}, {1}", type.FullName, type.Assembly.GetName().Name);
            entityType = Metadata().Entities.FirstOrDefault(e => e.Name == entityTypeName);
            if (entityType == null)
                throw new BeetleException(string.Format(Resources.EntityTypeCannotBeFound, entityTypeName));

            return entityType;
        }

        /// <summary>
        /// Adds parameters to the command.
        /// </summary>
        /// <param name="command">The command.</param>
        /// <param name="parameters">The parameters.</param>
        private static void AddCommandParameters(IDbCommand command, IEnumerable<KeyValuePair<string, object>> parameters) {
            foreach (var prm in parameters) {
                var parameter = command.CreateParameter();
                parameter.ParameterName = prm.Key;
                parameter.Value = prm.Value ?? DBNull.Value;
                command.Parameters.Add(parameter);
            }
        }

        /// <summary>
        /// Gets the identity select SQL.
        /// </summary>
        /// <param name="dbType">Type of the database.</param>
        /// <returns></returns>
        protected virtual string GetIdentitySelectSql(DbType dbType) {
            switch (dbType) {
                case DbType.SqlCe:
                    return "@@IDENTITY";
                default:
                    return "SCOPE_IDENTITY()";
            }
        }

        /// <summary>
        /// Escapes the SQL identifier.
        /// </summary>
        /// <param name="dbType">Type of the database.</param>
        /// <param name="sqlIdentifier">The SQL identifier.</param>
        /// <returns></returns>
        protected virtual string EscapeSqlIdentifier(DbType dbType, string sqlIdentifier) {
            return "[" + sqlIdentifier + "]";
        }

        /// <summary>
        /// Gets the type of the database.
        /// </summary>
        /// <value>
        /// The type of the database.
        /// </value>
        /// <exception cref="System.InvalidOperationException">Connection cannot be null.</exception>
        public virtual DbType DbType {
            get {
                if (Connection == null)
                    throw new InvalidOperationException(Resources.ConnectionCannotBeNull);

                var connectionType = Connection.GetType().Name;
                if (connectionType.StartsWith("Firebird"))
                    return DbType.Firebird;
                if (connectionType.StartsWith("MySql"))
                    return DbType.MySql;
                if (connectionType.StartsWith("Oracle"))
                    return DbType.Oracle;
                if (connectionType.StartsWith("NpgSql") || connectionType.StartsWith("PgSql"))
                    return DbType.PostgreSql;
                if (connectionType.StartsWith("SqlCe"))
                    return DbType.SqlCe;
                if (connectionType.StartsWith("SQLite"))
                    return DbType.SQLite;

                return DbType.SqlServer;
            }
        }

        /// <summary>
        /// Gets the connection.
        /// </summary>
        /// <value>
        /// The connection.
        /// </value>
        public abstract IDbConnection Connection { get; }

        /// <summary>
        /// Gets the model namespace.
        /// </summary>
        /// <value>
        /// The model namespace.
        /// </value>
        public virtual string ModelNamespace { get { return null; } }

        /// <summary>
        /// Gets the model assembly.
        /// </summary>
        /// <value>
        /// The model assembly.
        /// </value>
        public virtual string ModelAssembly { get { return null; } }
    }
}
