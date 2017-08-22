using System;
using System.Linq;
using System.Linq.Expressions;
using System.Data.Entity;
using System.Reflection;

namespace Beetle.EntityFramework {
    using Server;

    public class EFQueryHandler: QueryableHandler {
        private static readonly MethodInfo _skipMethod;
        private static readonly MethodInfo _takeMethod;
        private static readonly Lazy<EFQueryHandler> _instance = new Lazy<EFQueryHandler>(() => new EFQueryHandler());

        static EFQueryHandler() {
            var queryExtensionsType = typeof(QueryableExtensions);
            _skipMethod = queryExtensionsType.GetMethod("Skip");
            _takeMethod = queryExtensionsType.GetMethod("Take");
        }

        public override IQueryable Skip(IQueryable query, int count) {
            Expression<Func<int>> countAccessor = () => count;
            var mi = _skipMethod.MakeGenericMethod(query.ElementType);
            return (IQueryable)mi.Invoke(null, new object[] { query, countAccessor });
        }

        public override IQueryable Take(IQueryable query, int count) {
            Expression<Func<int>> countAccessor = () => count;
            var mi = _takeMethod.MakeGenericMethod(query.ElementType);
            return (IQueryable)mi.Invoke(null, new object[] { query, countAccessor });
        }

        public new static QueryableHandler Instance => _instance.Value;
    }
}
