namespace Beetle.Server {

    public class ProcessResult {

        public ProcessResult(ActionContext actionContext) {
            ActionContext = actionContext;
        }

        public object Result { get; set; }

        public object UserData { get; set; }

        public int? InlineCount { get; set; }

        public ActionContext ActionContext { get; }
    }
}
