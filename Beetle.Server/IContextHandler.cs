using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Beetle.Server.Meta;

namespace Beetle.Server {

    public interface IContextHandler<out TContext>: IContextHandler {

        TContext CreateContext();

        TContext Context { get; }
    }

    public interface IContextHandler {

        void Initialize();

        Metadata Metadata();

        object CreateType(string typeName);

        object HandleUnknownAction(string action);

        ProcessResult ProcessRequest(object contentValue, IEnumerable<KeyValuePair<string, string>> queryParameters, ActionContext actionContext, IBeetleConfig actionConfig, IBeetleService service);

        /// <summary>
        /// Handles the unmapped objects (which does not mapped to persistence layer, like DTOs or Proxies).
        /// </summary>
        IEnumerable<EntityBag> HandleUnmappeds(IEnumerable<EntityBag> unmappeds);

        Task<SaveResult> SaveChanges(IEnumerable<EntityBag> entities, SaveContext saveContext);

        IContentHandler<IEnumerable> EnumerableHandler { get; }

        IQueryHandler<IQueryable> QueryableHandler { get; }

        event BeforeQueryExecuteDelegate BeforeHandleQuery;

        void OnBeforeHandleQuery(BeforeQueryExecuteEventArgs args);

        event BeforeQueryExecuteDelegate BeforeQueryExecute;

        void OnBeforeQueryExecute(BeforeQueryExecuteEventArgs args);

        event AfterQueryExecuteDelegate AfterQueryExecute;

        void OnAfterQueryExecute(AfterQueryExecuteEventArgs args);

        event BeforeSaveDelegate BeforeSaveChanges;

        event AfterSaveDelegate AfterSaveChanges;
    }
}
