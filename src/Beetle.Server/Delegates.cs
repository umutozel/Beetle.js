using System;
using System.Linq;

namespace Beetle.Server {

    public class BeforeQueryExecuteEventArgs : EventArgs {

        public BeforeQueryExecuteEventArgs(ActionContext actionContext, IQueryable query) {
            ActionContext = actionContext;
            Query = query;
        }

        public ActionContext ActionContext { get; }

        public IQueryable Query { get; set; }

        public string UserData { get; set; }
    }

    public delegate void BeforeQueryExecuteDelegate(object sender, BeforeQueryExecuteEventArgs eventArgs);

    public class AfterQueryExecuteEventArgs : EventArgs {

        public AfterQueryExecuteEventArgs(ActionContext actionContext, IQueryable query, object result, object userData) {
            ActionContext = actionContext;
            Query = query;
            Result = result;
            UserData = userData;
        }

        public ActionContext ActionContext { get; }

        public IQueryable Query { get; }

        public object Result { get; set; }

        public object UserData { get; set; }
    }

    public delegate void AfterQueryExecuteDelegate(object sender, AfterQueryExecuteEventArgs eventArgs);

    public class BeforeSaveEventArgs : EventArgs {

        public BeforeSaveEventArgs(SaveContext saveContext) {
            SaveContext = saveContext;
        }

        public SaveContext SaveContext { get; }
    }

    public delegate void BeforeSaveDelegate(object sender, BeforeSaveEventArgs eventArgs);

    public class AfterSaveEventArgs : EventArgs {

        public AfterSaveEventArgs(SaveResult saveResult) {
            SaveResult = saveResult;
        }

        public SaveResult SaveResult { get; }
    }

    public delegate void AfterSaveDelegate(object sender, AfterSaveEventArgs eventArgs);
}
