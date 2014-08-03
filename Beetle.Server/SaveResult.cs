using System;
using System.Collections.Generic;

namespace Beetle.Server {

    /// <summary>
    /// Save result will be returned to client after save operation.
    /// </summary>
    public class SaveResult {
        private readonly int _affectedCount;
        private readonly List<GeneratedValue> _generatedValues;
        private readonly HashSet<object> _generatedEntities;
        private static readonly Lazy<SaveResult> _empty = new Lazy<SaveResult>(() => new SaveResult());

        public static SaveResult Empty {
            get { return _empty.Value; }
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="SaveResult"/> class.
        /// </summary>
        /// <param name="affectedCount">The affected count.</param>
        public SaveResult(int affectedCount = 0) {
            _affectedCount = affectedCount;
            _generatedValues = new List<GeneratedValue>();
            _generatedEntities = new HashSet<object>();
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="SaveResult" /> class.
        /// </summary>
        /// <param name="generatedValues">The generated values.</param>
        /// <param name="generatedEntities">The generated entities.</param>
        public SaveResult(IEnumerable<GeneratedValue> generatedValues, IEnumerable<object> generatedEntities = null) {
            _generatedValues = generatedValues == null ? new List<GeneratedValue>() : new List<GeneratedValue>(generatedValues);
            _generatedEntities = generatedEntities == null ? new HashSet<object>() : new HashSet<object>(generatedEntities);
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="SaveResult" /> class.
        /// </summary>
        /// <param name="affectedCount">The affected count.</param>
        /// <param name="generatedValues">The generated values.</param>
        /// <param name="generatedEntities">The generated entities.</param>
        public SaveResult(int affectedCount, IEnumerable<GeneratedValue> generatedValues, IEnumerable<object> generatedEntities = null)
            : this(generatedValues, generatedEntities) {
            _affectedCount = affectedCount;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="SaveResult" /> class.
        /// </summary>
        /// <param name="affectedCount">The affected count.</param>
        /// <param name="generatedValues">The generated values.</param>
        /// <param name="generatedEntities">The generated entities.</param>
        /// <param name="userData">The user data.</param>
        public SaveResult(int affectedCount, IEnumerable<GeneratedValue> generatedValues, IEnumerable<object> generatedEntities, object userData = null)
            : this(affectedCount, generatedValues, generatedEntities) {
            UserData = userData;
        }

        /// <summary>
        /// Gets or sets the affected entity count.
        /// </summary>
        /// <value>
        /// The affected entity count.
        /// </value>
        public int AffectedCount {
            get { return _affectedCount; }
        }

        /// <summary>
        /// Gets the generated values.
        /// </summary>
        /// <value>
        /// The generated values.
        /// </value>
        public List<GeneratedValue> GeneratedValues {
            get { return _generatedValues; }
        }

        /// <summary>
        /// Gets or sets the generated entities.
        /// </summary>
        /// <value>
        /// The generated entities.
        /// </value>
        public HashSet<object> GeneratedEntities {
            get { return _generatedEntities; }
        }

        /// <summary>
        /// Gets or sets the user data. One can override the SaveChanges method and can set custom value to this object.
        /// </summary>
        /// <value>
        /// The user data.
        /// </value>
        public object UserData { get; set; }
    }
}
