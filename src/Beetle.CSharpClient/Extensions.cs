using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Beetle.CSharpClient {

    public static class Extensions {

        public static async Task<List<TResult>> ToList<TResult>(this IQueryable<TResult> query) {
            if (query.Provider is IAsyncQueryProvider provider)
                return (await provider.ExecuteListAsync<TResult>(query.Expression)).ToList();

            throw new InvalidOperationException();
        }
    }
}
