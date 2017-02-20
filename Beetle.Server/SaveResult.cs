using System;
using System.Collections.Generic;

namespace Beetle.Server {

    public class SaveResult {
        private readonly int _affectedCount;
        private readonly List<GeneratedValue> _generatedValues;
        private readonly HashSet<object> _generatedEntities;
        private static readonly Lazy<SaveResult> _empty = new Lazy<SaveResult>(() => new SaveResult());

        public static SaveResult Empty {
            get { return _empty.Value; }
        }

        public SaveResult(int affectedCount = 0) {
            _affectedCount = affectedCount;
            _generatedValues = new List<GeneratedValue>();
            _generatedEntities = new HashSet<object>();
        }

        public SaveResult(IEnumerable<GeneratedValue> generatedValues, IEnumerable<object> generatedEntities = null) {
            _generatedValues = generatedValues == null ? new List<GeneratedValue>() : new List<GeneratedValue>(generatedValues);
            _generatedEntities = generatedEntities == null ? new HashSet<object>() : new HashSet<object>(generatedEntities);
        }

        public SaveResult(int affectedCount, IEnumerable<GeneratedValue> generatedValues, IEnumerable<object> generatedEntities = null)
            : this(generatedValues, generatedEntities) {
            _affectedCount = affectedCount;
        }

        public SaveResult(int affectedCount, IEnumerable<GeneratedValue> generatedValues, IEnumerable<object> generatedEntities, object userData = null)
            : this(affectedCount, generatedValues, generatedEntities) {
            UserData = userData;
        }

        public int AffectedCount {
            get { return _affectedCount; }
        }

        public List<GeneratedValue> GeneratedValues {
            get { return _generatedValues; }
        }

        public HashSet<object> GeneratedEntities {
            get { return _generatedEntities; }
        }

        /// <summary>
        /// Gets or sets the user data. One can override the SaveChanges method and can set custom value to this object. Will be carried as a HTTP Header
        /// </summary>
        public object UserData { get; set; }
    }
}
