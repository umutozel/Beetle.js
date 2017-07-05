using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace Beetle.CSharpClient {

    public class BeetleQuery<T> : IOrderedQueryable<T> {
        private readonly BeetleQueryProvider _provider;

        internal BeetleQuery(BeetleQueryProvider provider) {
            _provider = provider ?? throw new ArgumentNullException(nameof(provider));
            Expression = Expression.Constant(this);
        }

        internal BeetleQuery(BeetleQueryProvider provider, Expression expression) {
            if (!typeof(IQueryable<T>).GetTypeInfo().IsAssignableFrom(expression.Type.GetTypeInfo()))
                throw new ArgumentOutOfRangeException(nameof(expression));

            _provider = provider ?? throw new ArgumentNullException(nameof(provider));
            Expression = expression;
        }

        public Type ElementType => typeof(T);

        public Expression Expression { get; }

        public IQueryProvider Provider => _provider;

        public IEnumerator<T> GetEnumerator() {
            return _provider.ExecuteList<T>(Expression).GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator() {
            return GetEnumerator();
        }
    }
}
