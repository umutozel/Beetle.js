using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Beetle.Server {
    using Interface;
    using Meta;
    using Properties;

    public abstract class ContextHandler<TContext> : ContextHandler, IContextHandler<TContext> {

        protected ContextHandler() {
        }

        protected ContextHandler(TContext context) {
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

        public virtual IContentHandler<IEnumerable> EnumerableHandler => Server.EnumerableHandler.Instance;

        public virtual IQueryHandler<IQueryable> QueryableHandler => Server.QueryableHandler.Instance;

        public virtual void Initialize() {
        }

        public abstract Metadata Metadata();

        public abstract object CreateType(string typeName);

        public virtual object HandleUnknownAction(string action) {
            throw new NotImplementedException();
        }

        public virtual ProcessResult ProcessRequest(ActionContext actionContext) {
            return Helper.DefaultRequestProcessor(actionContext);
        }

        /// <summary>
        /// Handles the unmapped objects (which does not mapped to persistence layer, like DTOs or Proxies).
        /// </summary>
        public virtual IList<EntityBag> HandleUnmappeds(IEnumerable<EntityBag> unmappeds) {
            throw new NotImplementedException();
        }

        public abstract Task<SaveResult> SaveChanges(SaveContext saveContext);

        public virtual IList<GeneratedValue> GetGeneratedValues(IEnumerable<EntityBag> entityBags) {
            return Helper.GetGeneratedValues(entityBags, Metadata());
        }

        public event BeforeQueryExecuteDelegate BeforeHandleQuery;

        void IContextHandler.OnBeforeHandleQuery(BeforeQueryExecuteEventArgs args) {
            OnBeforeHandleQuery(args);
        }

        protected virtual void OnBeforeHandleQuery(BeforeQueryExecuteEventArgs args) {
            BeforeHandleQuery?.Invoke(this, args);
        }

        public event BeforeQueryExecuteDelegate BeforeQueryExecute;

        void IContextHandler.OnBeforeQueryExecute(BeforeQueryExecuteEventArgs args) {
            OnBeforeQueryExecute(args);
        }

        protected virtual void OnBeforeQueryExecute(BeforeQueryExecuteEventArgs args) {
            BeforeQueryExecute?.Invoke(this, args);
        }

        public event AfterQueryExecuteDelegate AfterQueryExecute;

        void IContextHandler.OnAfterQueryExecute(AfterQueryExecuteEventArgs args) {
            OnAfterQueryExecute(args);
        }

        protected virtual void OnAfterQueryExecute(AfterQueryExecuteEventArgs args) {
            AfterQueryExecute?.Invoke(this, args);
        }

        public event BeforeSaveDelegate BeforeSaveChanges;

        protected virtual void OnBeforeSaveChanges(BeforeSaveEventArgs args) {
            BeforeSaveChanges?.Invoke(this, args);
        }

        public event AfterSaveDelegate AfterSaveChanges;

        protected virtual void OnAfterSaveChanges(AfterSaveEventArgs args) {
            AfterSaveChanges?.Invoke(this, args);
        }
    }
}