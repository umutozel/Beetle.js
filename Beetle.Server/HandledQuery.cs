using System.Linq;

namespace Beetle.Server {
    /// <summary>
    /// Stores query handle results.
    /// </summary>
    public struct HandledQuery {
        private readonly IQueryable _query;
        private readonly IQueryable _inlineCountQuery;

        /// <summary>
        /// Initializes a new instance of the <see cref="HandledQuery"/> struct.
        /// </summary>
        public HandledQuery(IQueryable query, IQueryable inlineCountQuery) {
            _query = query;
            _inlineCountQuery = inlineCountQuery;
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
    }
}
