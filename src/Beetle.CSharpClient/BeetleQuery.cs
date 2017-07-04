using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace Beetle.CSharpClient {

    public class BeetleQuery<T> : IOrderedQueryable<T> {
        private readonly BeetleQueryProvider _provider;
        private readonly Expression _expression;

        internal BeetleQuery(BeetleQueryProvider provider) {
            _provider = provider ?? throw new ArgumentNullException("provider");
            _expression = Expression.Constant(this);
        }

        internal BeetleQuery(BeetleQueryProvider provider, Expression expression) {
            if (!typeof(IQueryable<T>).GetTypeInfo().IsAssignableFrom(expression.Type.GetTypeInfo()))
                throw new ArgumentOutOfRangeException("expression");

            _provider = provider ?? throw new ArgumentNullException("provider");
            _expression = expression ?? throw new ArgumentNullException("şexpression");
        }

        public Type ElementType => typeof(T);

        public Expression Expression => _expression;

        public IQueryProvider Provider => _provider;

        public IEnumerator<T> GetEnumerator() {
            return _provider.ExecuteList<T>(_expression).GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator() {
            return GetEnumerator();
        }
    }
}
