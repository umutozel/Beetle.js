using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Threading.Tasks;

namespace Beetle.CSharpClient {

    internal class BeetleQueryProvider : IAsyncQueryProvider {
        private readonly BeetleService _service;
        private readonly string _url;

        internal BeetleQueryProvider(BeetleService service, string url) {
            _service = service;
            _url = url;
        }

        IQueryable<T> IQueryProvider.CreateQuery<T>(Expression expression) {
            return new BeetleQuery<T>(this, expression);
        }

        IQueryable IQueryProvider.CreateQuery(Expression expression) {
            Type elementType = Helper.GetElementType(expression.Type);
            try {
                return (IQueryable)Activator.CreateInstance(
                    typeof(BeetleQuery<>).MakeGenericType(elementType), new object[] { this, expression }
                );
            }
            catch (TargetInvocationException tie) {
                throw tie.InnerException;
            }
        }

        T IQueryProvider.Execute<T>(Expression expression) {
            return _service.ExecuteQuery<T>(expression, _url).Result;
        }

        object IQueryProvider.Execute(Expression expression) {
            return _service.ExecuteQuery(expression, _url).Result;
        }

        public IEnumerable<T> ExecuteList<T>(Expression expression) {
            return ExecuteListAsync<T>(expression).Result;
        }

        public Task<IEnumerable<T>> ExecuteListAsync<T>(Expression expression) {
            return _service.ExecuteQueryList<T>(expression, _url);
        }

        public Task<T> ExecuteAsync<T>(Expression expression) {
            return _service.ExecuteQuery<T>(expression, _url);
        }
    }

    public interface IAsyncQueryProvider: IQueryProvider {
        Task<IEnumerable<T>> ExecuteListAsync<T>(Expression expression);
        Task<T> ExecuteAsync<T>(Expression expression);
    }
}
