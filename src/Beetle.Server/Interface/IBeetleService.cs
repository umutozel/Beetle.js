using System.Collections.Generic;
using System.Threading.Tasks;

namespace Beetle.Server.Interface {
    using Meta;

    public interface IBeetleService<out TContextHandler>: IBeetleService where TContextHandler: IContextHandler {

        new TContextHandler ContextHandler { get; }

        TContextHandler CreateContextHandler();
    }

    public interface IBeetleService {

        IBeetleConfig Config { get; }

        IContextHandler ContextHandler { get; }

        int? MaxResultCount { get; set; }

        bool CheckRequestHash { get; set; }

        Metadata Metadata();

        object CreateType(string typeName, string initialValues);

        ProcessResult ProcessRequest(ActionContext actionContext);

        IEnumerable<EntityBag> HandleUnknowns(IEnumerable<EntityBag> unknowns);

        Task<SaveResult> SaveChanges(object saveBundle);
        
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
