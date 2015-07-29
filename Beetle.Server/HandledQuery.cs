using System.Linq;

namespace Beetle.Server {
    /// <summary>
    /// Stores query handle results.
    /// </summary>
    public struct HandledQuery {
        private readonly IQueryable _query;
        private readonly IQueryable _inlineCountQuery;
        private readonly int? _takeCount;

        /// <summary>
        /// Initializes a new instance of the <see cref="HandledQuery"/> struct.
        /// </summary>
        public HandledQuery(IQueryable query, IQueryable inlineCountQuery, int? takeCount = null) {
            _query = query;
            _inlineCountQuery = inlineCountQuery;
            _takeCount = takeCount;
        }

        /// <summary>
        /// Gets the handled query.
        /// </summary>
        /// <value>
        /// The handled query.
        /// </value>
        public IQueryable Query {
            get { return _query; }
        }

        /// <summary>
        /// Gets the inline count query.
        /// </summary>
        /// <value>
        /// The inline count query.
        /// </value>
        public IQueryable InlineCountQuery {
            get { return _inlineCountQuery; }
        }

        /// <summary>
        /// Take value applied to query.
        /// </summary>
        /// <value>
        /// The take value.
        /// </value>
        public int? TakeCount {
            get { return _takeCount; }
        }
    }
}
