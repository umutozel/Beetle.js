using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace Beetle.Server {

    public class EntityValidationException : DataException {
        private readonly IEnumerable<EntityValidationResult> _entityValidationErrors;

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
            _entityValidationErrors = entityValidationErrors;
        }

        public EntityValidationException(string message, Exception innerException)
            : this(message, Enumerable.Empty<EntityValidationResult>(), innerException) {
        }

        public EntityValidationException(string message, IEnumerable<EntityValidationResult> entityValidationErrors, Exception innerException)
            : base(message, innerException) {
            _entityValidationErrors = entityValidationErrors;
        }

        public IEnumerable<EntityValidationResult> EntityValidationErrors { get { return _entityValidationErrors; } }
    }
}
