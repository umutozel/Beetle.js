namespace Beetle.Server {

    public class ProcessResult {
        private readonly ActionContext _actionContext;

        public ProcessResult(ActionContext actionContext) {
            _actionContext = actionContext;
        }

        public object Result { get; set; }
        public object UserData { get; set; }
        public int? InlineCount { get; set; }

        public ActionContext ActionContext { get { return _actionContext; } }
    }
}
