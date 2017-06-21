using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace Beetle.Server {

    public class EntityValidationResult {

        public EntityValidationResult(object entity, IEnumerable<ValidationResult> validationErrors) {
            Entity = entity;
            ValidationErrors = validationErrors;

            IsValid = !ValidationErrors.Any();
        }

        public object Entity { get; }

        public bool IsValid { get; }

        public IEnumerable<ValidationResult> ValidationErrors { get; }
    }
}
