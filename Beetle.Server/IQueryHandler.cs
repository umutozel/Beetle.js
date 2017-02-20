using System.Collections.Generic;

namespace Beetle.Server {

    public interface IQueryHandler<T>: IContentHandler<T> {

        HandledQuery HandleQuery(T query, IEnumerable<KeyValuePair<string, string>> parameters);

        /// <summary>
        /// Handles executer expression (any, all, first, single etc..).
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="executer">The executer expression.</param>
        /// <returns></returns>
        /// <exception cref="BeetleException">Invalid group by expression:  + prm.Value
        /// or
        /// Unknown beetle query parameter:  + prm.Key</exception>
        object HandleExecuter(T query, KeyValuePair<string, string> executer);

        T HandleOfType(T query, string ofType);

        T HandleWhere(T query, string filter);

        T HandleOrderBy(T query, string orderBy);

        T HandleInclude(T query, string expand);

        T HandleSelect(T query, string projection);

        T HandleSkip(T query, int count);

        T HandleTake(T query, int count);

        T HandleGroupBy(T query, string keySelector, string elementSelector);

        T HandleDistinct(T query, string elementSelector);

        T HandleReverse(T query);

        T HandleSelectMany(T query, string projection);

        T HandleSkipWhile(T query, string predicate);

        T HandleTakeWhile(T query, string predicate);

        bool HandleAll(T query, string predicate);

        bool HandleAny(T query, string predicate);

        object HandleAvg(T query, string elementSelector);

        object HandleMax(T query, string elementSelector);

        object HandleMin(T query, string elementSelector);

        object HandleSum(T query, string elementSelector);

        object HandleCount(T query, string predicate);

        object HandleFirst(T query, string predicate);

        object HandleFirstOrDefault(T query, string predicate);

        object HandleSingle(T query, string predicate);

        object HandleSingleOrDefault(T query, string predicate);

        object HandleLast(T query, string predicate);

        object HandleLastOrDefault(T query, string predicate);
    }
}
