using System.Linq;

namespace Beetle.Server {

    public struct HandledQuery {
        private readonly IQueryable _query;
        private readonly IQueryable _inlineCountQuery;
        private readonly int? _takeCount;

        public HandledQuery(IQueryable query, IQueryable inlineCountQuery, int? takeCount = null) {
            _query = query;
            _inlineCountQuery = inlineCountQuery;
            _takeCount = takeCount;
        }

        public IQueryable Query {
            get { return _query; }
        }

        public IQueryable InlineCountQuery {
            get { return _inlineCountQuery; }
        }

        public int? TakeCount {
            get { return _takeCount; }
        }
    }
}
