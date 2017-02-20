using System;
using System.Runtime.Serialization;

namespace Beetle.Server {

    public class BeetleException : ApplicationException {

        public BeetleException(string message)
            : base(message) {
        }

        public BeetleException(string message, Exception innerException)
            : base(message, innerException) {
        }

        public BeetleException(SerializationInfo serializationInfo, StreamingContext streamingContext)
            : base(serializationInfo, streamingContext) {
        }
    }
}
