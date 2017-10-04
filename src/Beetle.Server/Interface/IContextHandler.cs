using System.Collections;
using System.Linq;
using System.Threading.Tasks;

namespace Beetle.Server.Interface {
    using Meta;

    public interface IContextHandler<out TContext>: IContextHandler {

        TContext CreateContext();

        TContext Context { get; }
    }

    public interface IContextHandler {

        IContentHandler<IEnumerable> EnumerableHandler { get; }

        IQueryHandler<IQueryable> QueryableHandler { get; }

        void Initialize();

        Metadata Metadata();

        object CreateType(string typeName);

        object HandleUnknownAction(string action);

        ProcessResult ProcessRequest(ActionContext actionContext);

        Task<SaveResult> SaveChanges(SaveContext saveContext);

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
