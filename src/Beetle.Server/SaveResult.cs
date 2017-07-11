using System;
using System.Collections.Generic;

namespace Beetle.Server {

    public class SaveResult {
        private static readonly Lazy<SaveResult> _empty = new Lazy<SaveResult>(() => new SaveResult());

        public static SaveResult Empty => _empty.Value;

        public SaveResult(int affectedCount = 0) {
            AffectedCount = affectedCount;
            GeneratedValues = new List<GeneratedValue>();
            GeneratedEntities = new HashSet<object>();
        }

        public SaveResult(IEnumerable<GeneratedValue> generatedValues, IEnumerable<object> generatedEntities = null) {
            GeneratedValues = generatedValues == null ? new List<GeneratedValue>() : new List<GeneratedValue>(generatedValues);
            GeneratedEntities = generatedEntities == null ? new HashSet<object>() : new HashSet<object>(generatedEntities);
        }

        public SaveResult(int affectedCount, IEnumerable<GeneratedValue> generatedValues, IEnumerable<object> generatedEntities = null)
            : this(generatedValues, generatedEntities) {
            AffectedCount = affectedCount;
        }

        public SaveResult(int affectedCount, IEnumerable<GeneratedValue> generatedValues, IEnumerable<object> generatedEntities, object userData = null)
            : this(affectedCount, generatedValues, generatedEntities) {
            UserData = userData;
        }

        public int AffectedCount { get; }

        public List<GeneratedValue> GeneratedValues { get; }

        public HashSet<object> GeneratedEntities { get; }

        /// <summary>
        /// Gets or sets the user data. 
        /// One can override the SaveChanges method and can set custom value to this object. 
        /// Will be carried as a HTTP Header
        /// </summary>
        public object UserData { get; set; }
    }
}
