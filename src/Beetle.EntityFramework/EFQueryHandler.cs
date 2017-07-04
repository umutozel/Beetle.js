using System;
#if EF_CORE
using Microsoft.EntityFrameworkCore.Extensions.Internal;
#else
using System.Data.Entity;
#endif
using System.Linq;
using System.Linq.Expressions;
#if NET_STANDARD
using System.Reflection;
#endif

#if EF_CORE
namespace Beetle.EntityFrameworkCore {
#else
namespace Beetle.EntityFramework {
#endif
    using Server;

    public class EFQueryHandler: QueryableHandler {
        private static readonly Lazy<EFQueryHandler> _instance = new Lazy<EFQueryHandler>(() => new EFQueryHandler());

        public override IQueryable Skip(IQueryable query, int count) {
            Expression<Func<int>> countAccessor = () => count;
            var mi = typeof (QueryableExtensions).GetMethod("Skip").MakeGenericMethod(query.ElementType);
            return mi.Invoke(null, new object[] { query, countAccessor }) as IQueryable;
        }

        public override IQueryable Take(IQueryable query, int count) {
            Expression<Func<int>> countAccessor = () => count;
            var mi = typeof(QueryableExtensions).GetMethod("Take").MakeGenericMethod(query.ElementType);
            return mi.Invoke(null, new object[] { query, countAccessor }) as IQueryable;
        }

        public new static QueryableHandler Instance => _instance.Value;
    }
}
