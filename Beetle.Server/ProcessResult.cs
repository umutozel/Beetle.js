namespace Beetle.Server {

    /// <summary>
    /// Beetle service processed request result
    /// </summary>
    public class ProcessResult {
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
        public string UserData { get; set; }
        /// <summary>
        /// Gets or sets the inline count.
        /// </summary>
        /// <value>
        /// The inline count.
        /// </value>
        public int? InlineCount { get; set; }
    }
}
