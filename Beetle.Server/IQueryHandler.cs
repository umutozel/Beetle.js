using System.Collections.Generic;

namespace Beetle.Server {

    /// <summary>
    /// Common structure for content handlers with query parameter support.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public interface IQueryHandler<T>: IContentHandler<T> {

        /// <summary>
        /// Handles all query parameters.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="parameters">The parameters.</param>
        /// <returns></returns>
        /// <exception cref="BeetleException">
        /// Invalid group by expression:  + prm.Value
        /// or
        /// Unknown beetle query parameter:  + prm.Key
        /// </exception>
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

        /// <summary>
        /// Handles the of type query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="ofType">Type of the of.</param>
        /// <returns></returns>
        /// <exception cref="System.ArgumentException">
        /// Cannot change type query type for non-generic queries.
        /// or
        /// Cannot find type information for:  + ofTypeFullName
        /// </exception>
        T HandleOfType(T query, string ofType);

        /// <summary>
        /// Handles the where (filter) query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="filter">The filter.</param>
        /// <returns></returns>
        T HandleWhere(T query, string filter);

        /// <summary>
        /// Handles the order by query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="orderBy">The order by.</param>
        /// <returns></returns>
        T HandleOrderBy(T query, string orderBy);

        /// <summary>
        /// Handles the include (expand) query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="expand">The expand.</param>
        /// <returns></returns>
        T HandleInclude(T query, string expand);

        /// <summary>
        /// Handles the select query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="projection">The projection.</param>
        /// <returns></returns>
        T HandleSelect(T query, string projection);

        /// <summary>
        /// Handles the distinct query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="count">The count.</param>
        /// <returns></returns>
        T HandleSkip(T query, int count);

        /// <summary>
        /// Handles the distinct query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="count">The count.</param>
        /// <returns></returns>
        T HandleTake(T query, int count);

        /// <summary>
        /// Handles the group by query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="keySelector">The key selector.</param>
        /// <param name="elementSelector">The element selector.</param>
        /// <returns></returns>
        T HandleGroupBy(T query, string keySelector, string elementSelector);

        /// <summary>
        /// Handles the distinct query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="elementSelector">The element selector.</param>
        /// <returns></returns>
        T HandleDistinct(T query, string elementSelector);

        /// <summary>
        /// Handles the distinct query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <returns></returns>
        T HandleReverse(T query);

        /// <summary>
        /// Handles the selectMany query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="projection">The projection.</param>
        /// <returns></returns>
        T HandleSelectMany(T query, string projection);

        /// <summary>
        /// Handles the selectWhile query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        T HandleSkipWhile(T query, string predicate);

        /// <summary>
        /// Handles the takeWhile query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        T HandleTakeWhile(T query, string predicate);

        /// <summary>
        /// Handles the all query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        bool HandleAll(T query, string predicate);

        /// <summary>
        /// Handles the any query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        bool HandleAny(T query, string predicate);

        /// <summary>
        /// Handles the avg query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="elementSelector">The element selector.</param>
        /// <returns></returns>
        object HandleAvg(T query, string elementSelector);

        /// <summary>
        /// Handles the max query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="elementSelector">The element selector.</param>
        /// <returns></returns>
        object HandleMax(T query, string elementSelector);

        /// <summary>
        /// Handles the max query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="elementSelector">The element selector.</param>
        /// <returns></returns>
        object HandleMin(T query, string elementSelector);

        /// <summary>
        /// Handles the sum query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="elementSelector">The element selector.</param>
        /// <returns></returns>
        object HandleSum(T query, string elementSelector);

        /// <summary>
        /// Handles the count query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        object HandleCount(T query, string predicate);

        /// <summary>
        /// Handles the first query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        object HandleFirst(T query, string predicate);

        /// <summary>
        /// Handles the firstOrDefault query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        object HandleFirstOrDefault(T query, string predicate);

        /// <summary>
        /// Handles the single query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        object HandleSingle(T query, string predicate);

        /// <summary>
        /// Handles the singleOrDefault query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        object HandleSingleOrDefault(T query, string predicate);

        /// <summary>
        /// Handles the last query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        object HandleLast(T query, string predicate);

        /// <summary>
        /// Handles the lastOrDefault query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        object HandleLastOrDefault(T query, string predicate);
    }
}
