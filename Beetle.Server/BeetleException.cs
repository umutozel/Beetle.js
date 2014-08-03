using System;
using System.Runtime.Serialization;

namespace Beetle.Server {

    /// <summary>
    /// Common Exception base class.
    /// Sometimes we need to know if an exception is ours.
    /// </summary>
    public class BeetleException : ApplicationException {

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleException"/> class.
        /// </summary>
        /// <param name="message">A message that describes the error.</param>
        public BeetleException(string message)
            : base(message) {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleException"/> class.
        /// </summary>
        /// <param name="message">The error message that explains the reason for the exception.</param>
        /// <param name="innerException">The exception that is the cause of the current exception. If the <paramref name="innerException" /> parameter is not a null reference, the current exception is raised in a catch block that handles the inner exception.</param>
        public BeetleException(string message, Exception innerException)
            : base(message, innerException) {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleException"/> class.
        /// </summary>
        /// <param name="serializationInfo">The serialization info.</param>
        /// <param name="streamingContext">The streaming context.</param>
        public BeetleException(SerializationInfo serializationInfo, StreamingContext streamingContext)
            : base(serializationInfo, streamingContext) {
        }
    }
}
