using System.Collections;
using Beetle.Server.Properties;
using System;
using System.Collections.Generic;
using System.Linq;
using Beetle.Server.Meta;
using System.Threading.Tasks;

namespace Beetle.Server {

    public abstract class ContextHandler<TContext> : ContextHandler, IContextHandler<TContext> {

        protected ContextHandler() {
        }

        protected ContextHandler(TContext context) {
            Context = context;
        }

        protected ContextHandler(IQueryHandler<IQueryable> queryableHandler)
            : base(queryableHandler) {
        }

        protected ContextHandler(TContext context, IQueryHandler<IQueryable> queryableHandler)
            : base(queryableHandler) {
            Context = context;
        }

        public override void Initialize() {
            if (Equals(Context, default(TContext)))
                Context = CreateContext();
        }

        public virtual TContext CreateContext() {
            return Activator.CreateInstance<TContext>();
        }

        public TContext Context { get; private set; }
    }

    public abstract class ContextHandler : IContextHandler {
        private readonly IQueryHandler<IQueryable> _queryableHandler;

        protected ContextHandler()
            : this(Server.QueryableHandler.Instance) {
        }

        protected ContextHandler(IQueryHandler<IQueryable> queryableHandler) {
            _queryableHandler = queryableHandler;
        }

        public virtual void Initialize() {
        }

        public abstract Metadata Metadata();

        public virtual object CreateType(string typeName) {
            var type = Type.GetType(typeName);
            if (type == null) throw new ArgumentException(string.Format(Resources.TypeCouldNotBeFound, typeName));
            return Activator.CreateInstance(type);
        }

        public virtual object HandleUnknownAction(string action) {
            throw new NotImplementedException();
        }

        public virtual ProcessResult ProcessRequest(object contentValue, IEnumerable<KeyValuePair<string, string>> queryParameters,
                                                    ActionContext actionContext, BeetleConfig actionConfig, IBeetleService service) {
            return Helper.DefaultRequestProcessor(contentValue, queryParameters, actionContext, service, this, actionConfig);
        }

        /// <summary>
        /// Handles the unmapped objects (which does not mapped to persistence layer, like DTOs or Proxies).
        /// </summary>
        public virtual IEnumerable<EntityBag> HandleUnmappeds(IEnumerable<EntityBag> unmappeds) {
            var retVal = new List<EntityBag>();
            foreach (var unmapped in unmappeds) {
                var client = MapToEntity(unmapped.ClientEntity);
                if (client == null) continue;

                var server = MapToEntity(unmapped.Entity);
                if (server == null) continue;

                var originalValues = unmapped.OriginalValues == null ? null : MapProperties(unmapped.Entity, unmapped.OriginalValues);

                retVal.Add(new EntityBag(client, server, unmapped.EntityState, originalValues, unmapped.Index, null, unmapped.ForceUpdate));
            }
            return retVal;
        }

        public virtual object MapToEntity(object unmapped) {
            return null;
        }

        /// <summary>
        /// Maps unknown objects original value properties to entity properties.
        /// </summary>
        /// <returns>New dictionary which represents values for mapped entity.</returns>
        public virtual IDictionary<string, object> MapProperties(object unmapped, IDictionary<string, object> unmappedOriginalValues) {
            return null;
        }

        /// <summary>
        /// Gets the generated values for handled unmapped objects.
        /// </summary>
        public virtual IEnumerable<GeneratedValue> GetHandledUnmappedGeneratedValues(IEnumerable<EntityBag> handledUnmappeds) {
            return Enumerable.Empty<GeneratedValue>();
        }

        public abstract Task<SaveResult> SaveChanges(IEnumerable<EntityBag> entities, SaveContext saveContext);

        public virtual IContentHandler<IEnumerable> EnumerableHandler {
            get { return Server.EnumerableHandler.Instance; }
        }

        public virtual IQueryHandler<IQueryable> QueryableHandler {
            get { return _queryableHandler; }
        }

        public virtual IEnumerable<GeneratedValue> GetGeneratedValues(IEnumerable<EntityBag> entityBags) {
            return Helper.GetGeneratedValues(entityBags, Metadata());
        }

        public event BeforeQueryExecuteDelegate BeforeHandleQuery;

        void IContextHandler.OnBeforeHandleQuery(BeforeQueryExecuteEventArgs args) {
            OnBeforeHandleQuery(args);
        }

        protected virtual void OnBeforeHandleQuery(BeforeQueryExecuteEventArgs args) {
            var handler = BeforeHandleQuery;
            if (handler != null)
                handler(this, args);
        }

        public event BeforeQueryExecuteDelegate BeforeQueryExecute;

        void IContextHandler.OnBeforeQueryExecute(BeforeQueryExecuteEventArgs args) {
            OnBeforeQueryExecute(args);
        }

        protected virtual void OnBeforeQueryExecute(BeforeQueryExecuteEventArgs args) {
            var handler = BeforeQueryExecute;
            if (handler != null)
                handler(this, args);
        }

        public event AfterQueryExecuteDelegate AfterQueryExecute;

        void IContextHandler.OnAfterQueryExecute(AfterQueryExecuteEventArgs args) {
            OnAfterQueryExecute(args);
        }

        protected virtual void OnAfterQueryExecute(AfterQueryExecuteEventArgs args) {
            var handler = AfterQueryExecute;
            if (handler != null)
                handler(this, args);
        }

        public event BeforeSaveDelegate BeforeSaveChanges;

        protected virtual void OnBeforeSaveChanges(BeforeSaveEventArgs args) {
            var handler = BeforeSaveChanges;
            if (handler != null) handler(this, args);
        }

        public event AfterSaveDelegate AfterSaveChanges;

        protected virtual void OnAfterSaveChanges(AfterSaveEventArgs args) {
            var handler = AfterSaveChanges;
            if (handler != null) handler(this, args);
        }

        public bool ValidateOnSaveEnabled { get; set; }
    }
}