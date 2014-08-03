using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace Beetle.Server {

    /// <summary>
    /// Represents validation results for single entity.
    /// </summary>
    public class EntityValidationResult {
        private readonly object _entity;
        private readonly bool _isValid;
        private readonly IEnumerable<ValidationResult> _validationErrors;

        /// <summary>
        /// Initializes a new instance of the <see cref="EntityValidationResult"/> class.
        /// </summary>
        /// <param name="entity">The entity.</param>
        /// <param name="validationErrors">The validation errors.</param>
        public EntityValidationResult(object entity, IEnumerable<ValidationResult> validationErrors) {
            _entity = entity;
            _validationErrors = validationErrors;

            _isValid = !_validationErrors.Any();
        }

        /// <summary>
        /// Gets the entity.
        /// </summary>
        /// <value>
        /// The entity.
        /// </value>
        public object Entity {
            get { return _entity; }
        }

        /// <summary>
        /// Gets a value indicating whether [is valid].
        /// </summary>
        /// <value>
        ///   <c>true</c> if [is valid]; otherwise, <c>false</c>.
        /// </value>
        public bool IsValid {
            get { return _isValid; }
        }

        /// <summary>
        /// Gets the validation errors.
        /// </summary>
        /// <value>
        /// The validation errors.
        /// </value>
        public IEnumerable<ValidationResult> ValidationErrors { get { return _validationErrors; } }
    }
}
