using System;
using System.Runtime.Serialization;

namespace Beetle.Server {

    public class BeetleException : Exception {

        public BeetleException(string message)
            : base(message) {
        }

        public BeetleException(string message, Exception innerException)
            : base(message, innerException) {
        }
    }
}
