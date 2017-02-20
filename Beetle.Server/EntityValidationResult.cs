using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace Beetle.Server {

    public class EntityValidationResult {
        private readonly object _entity;
        private readonly bool _isValid;
        private readonly IEnumerable<ValidationResult> _validationErrors;

        public EntityValidationResult(object entity, IEnumerable<ValidationResult> validationErrors) {
            _entity = entity;
            _validationErrors = validationErrors;

            _isValid = !_validationErrors.Any();
        }

        public object Entity {
            get { return _entity; }
        }

        public bool IsValid {
            get { return _isValid; }
        }

        public IEnumerable<ValidationResult> ValidationErrors { get { return _validationErrors; } }
    }
}
