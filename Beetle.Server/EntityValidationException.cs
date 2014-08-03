using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace Beetle.Server {

    /// <summary>
    /// Exception thrown from SaveChanges() when validating entities fails.
    /// </summary>
    public class EntityValidationException : DataException {
        private readonly IEnumerable<EntityValidationResult> _entityValidationErrors;

        /// <summary>
        /// Initializes a new instance of the <see cref="EntityValidationException"/> class.
        /// </summary>
        public EntityValidationException(): this("Validation Failed.") {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="EntityValidationException"/> class.
        /// </summary>
        /// <param name="entityValidationErrors">The entity validation errors.</param>
        public EntityValidationException(IEnumerable<EntityValidationResult> entityValidationErrors)
            : this("Validation Failed.", entityValidationErrors) {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="EntityValidationException"/> class.
        /// </summary>
        /// <param name="message">The message that describes the error.</param>
        public EntityValidationException(string message)
            : this(message, Enumerable.Empty<EntityValidationResult>()) {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="EntityValidationException"/> class.
        /// </summary>
        /// <param name="message">The message.</param>
        /// <param name="entityValidationErrors">The entity validation errors.</param>
        public EntityValidationException(string message, IEnumerable<EntityValidationResult> entityValidationErrors)
            : base(message) {
            _entityValidationErrors = entityValidationErrors;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="EntityValidationException"/> class.
        /// </summary>
        /// <param name="message">The error message that explains the reason for the exception.</param>
        /// <param name="innerException">The exception that is the cause of the current exception. If the <paramref name="innerException" /> parameter is not a null reference (Nothing in Visual Basic), the current exception is raised in a catch block that handles the inner exception.</param>
        public EntityValidationException(string message, Exception innerException)
            : this(message, Enumerable.Empty<EntityValidationResult>(), innerException) {
        }

        public EntityValidationException(string message, IEnumerable<EntityValidationResult> entityValidationErrors, Exception innerException)
            : base(message, innerException) {
            _entityValidationErrors = entityValidationErrors;
        }

        /// <summary>
        /// Gets the entity validation errors.
        /// </summary>
        /// <value>
        /// The entity validation errors.
        /// </value>
        public IEnumerable<EntityValidationResult> EntityValidationErrors { get { return _entityValidationErrors; } }
    }
}
