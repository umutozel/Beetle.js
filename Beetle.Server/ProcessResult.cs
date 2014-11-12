namespace Beetle.Server {

    /// <summary>
    /// Beetle service processed request result
    /// </summary>
    public class ProcessResult {
        private readonly ActionContext _actionContext;

        /// <summary>
        /// Initializes a new instance of the <see cref="ProcessResult"/> class.
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        public ProcessResult(ActionContext actionContext) {
            _actionContext = actionContext;
        }

        /// <summary>
        /// Gets or sets the result.
        /// </summary>
        /// <value>
        /// The result.
        /// </value>
        public object Result { get; set; }
        /// <summary>
        /// Gets or sets the user data.
        /// </summary>
        /// <value>
        /// The user data.
        /// </value>
        public object UserData { get; set; }
        /// <summary>
        /// Gets or sets the in-line count.
        /// </summary>
        /// <value>
        /// The in-line count.
        /// </value>
        public int? InlineCount { get; set; }

        /// <summary>
        /// Gets the action context.
        /// </summary>
        /// <value>
        /// The action context.
        /// </value>
        public ActionContext ActionContext { get { return _actionContext; } }
    }
}
