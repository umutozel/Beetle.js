using System.Collections.Generic;
using System.Threading.Tasks;

namespace Beetle.Server.Interface {

    public interface IBeetleService<out TContextHandler>: IBeetleService where TContextHandler: IContextHandler {

        TContextHandler CreateContextHandler();

        new TContextHandler ContextHandler { get; }
    }

    public interface IBeetleService {

        object Metadata();

        object CreateType(string typeName, string initialValues);

        ProcessResult ProcessRequest(object contentValue, ActionContext actionContext, IBeetleConfig actionConfig);

        IEnumerable<EntityBag> HandleUnknowns(IEnumerable<EntityBag> unknowns);

        Task<SaveResult> SaveChanges(object saveBundle);

        IBeetleConfig BeetleConfig { get; }

        IContextHandler ContextHandler { get; }

        int? MaxResultCount { get; set; }

        bool? CheckRequestHash { get; set; }

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
