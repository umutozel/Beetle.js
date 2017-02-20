using System;
using System.Data.Entity;
using System.Linq;
using System.Linq.Expressions;

namespace Beetle.Server.EntityFramework {

    public class EF6QueryHandler: QueryableHandler {
        private static readonly Lazy<EF6QueryHandler> _instance = new Lazy<EF6QueryHandler>(() => new EF6QueryHandler());

        public override IQueryable HandleSkip(IQueryable query, int count) {
            Expression<Func<int>> countAccessor = () => count;
            var mi = typeof (QueryableExtensions).GetMethod("Skip").MakeGenericMethod(query.ElementType);
            return mi.Invoke(null, new object[] { query, countAccessor }) as IQueryable;
        }

        public override IQueryable HandleTake(IQueryable query, int count) {
            Expression<Func<int>> countAccessor = () => count;
            var mi = typeof(QueryableExtensions).GetMethod("Take").MakeGenericMethod(query.ElementType);
            return mi.Invoke(null, new object[] { query, countAccessor }) as IQueryable;
        }

        public new static QueryableHandler Instance { get { return _instance.Value; } }
    }
}
