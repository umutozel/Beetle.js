using System;
using System.Collections.Generic;
using System.Linq;

namespace Beetle.Server {

    public class EntityValidationException : BeetleException {
        public EntityValidationException(): this("Validation Failed.") {
        }

        public EntityValidationException(IEnumerable<EntityValidationResult> entityValidationErrors)
            : this("Validation Failed.", entityValidationErrors) {
        }

        public EntityValidationException(string message)
            : this(message, Enumerable.Empty<EntityValidationResult>()) {
        }

        public EntityValidationException(string message, IEnumerable<EntityValidationResult> entityValidationErrors)
            : base(message) {
            EntityValidationErrors = entityValidationErrors;
        }

        public EntityValidationException(string message, Exception innerException)
            : this(message, Enumerable.Empty<EntityValidationResult>(), innerException) {
        }

        public EntityValidationException(string message, IEnumerable<EntityValidationResult> entityValidationErrors, 
                                         Exception innerException) : base(message, innerException) {
            EntityValidationErrors = entityValidationErrors;
        }

        public IEnumerable<EntityValidationResult> EntityValidationErrors { get; }
    }
}
