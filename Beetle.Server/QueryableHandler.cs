using Beetle.Server.Properties;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic;

namespace Beetle.Server {

    /// <summary>
    /// Applies beetle query parameters to query.
    /// </summary>
    public class QueryableHandler : IQueryHandler<IQueryable> {
        // for singleton.
        private static readonly Lazy<QueryableHandler> _instance = new Lazy<QueryableHandler>(() => new QueryableHandler());

        /// <summary>
        /// Processes the request.
        /// </summary>
        /// <param name="queryable">The query.</param>
        /// <param name="parameters">The parameters.</param>
        /// <param name="actionContext">The action context.</param>
        /// <param name="service">The service.</param>
        /// <param name="contextHandler">The context handler.</param>
        /// <returns></returns>
        /// <exception cref="System.ArgumentNullException">queryable</exception>
        public ProcessResult HandleContent(IQueryable queryable, IEnumerable<KeyValuePair<string, string>> parameters, ActionContext actionContext,
                                           IBeetleService service = null, IContextHandler contextHandler = null) {
            if (queryable == null)
                throw new ArgumentNullException("queryable");

            object result;
            int? inlineCount = null;
            // make before handle event callbacks
            if (service != null)
                queryable = service.OnBeforeHandleQuery(actionContext, queryable).Query;
            if (contextHandler != null)
                queryable = contextHandler.OnBeforeHandleQuery(actionContext, queryable).Query;

            var maxResultCount = actionContext.MaxResultCount;
            if (service != null && service.MaxResultCount > 0 && service.MaxResultCount < maxResultCount)
                maxResultCount = service.MaxResultCount;

            var queryParameterList = parameters == null
                ? null
                : (parameters as IList<KeyValuePair<string, string>> ?? parameters.ToList());
            if (queryParameterList != null && queryParameterList.Count > 0) {
                var executer = queryParameterList.SingleOrDefault(b => b.Key.StartsWith("exec;"));
                if (!executer.Equals(default(KeyValuePair<string, string>))) queryParameterList.Remove(executer);
                // handle query
                var handledQuery = HandleQuery(queryable, queryParameterList);
                queryable = handledQuery.Query;
                // make before execute callbacks
                if (service != null)
                    queryable = service.OnBeforeQueryExecute(actionContext, queryable).Query;
                if (contextHandler != null)
                    queryable = contextHandler.OnBeforeQueryExecute(actionContext, queryable).Query;
                // get in-line count
                if (handledQuery.InlineCountQuery != null)
                    inlineCount = Queryable.Count((dynamic)handledQuery.InlineCountQuery);
                // execute query
                if (!string.IsNullOrWhiteSpace(executer.Key))
                    result = HandleExecuter(queryable, executer);
                else {
                    if (maxResultCount > 0)
                        CheckResultCount(queryable, maxResultCount);
                    result = Enumerable.ToList((dynamic)queryable);
                }
            }
            else {
                // make before execute callbacks
                if (service != null)
                    queryable = service.OnBeforeQueryExecute(actionContext, queryable).Query;
                if (contextHandler != null)
                    queryable = contextHandler.OnBeforeQueryExecute(actionContext, queryable).Query;
                if (maxResultCount > 0)
                    CheckResultCount(queryable, maxResultCount);
                result = Enumerable.ToList((dynamic)queryable);
            }
            string userData = null;
            // make after execute callbacks
            if (service != null) {
                var modifiedResult = service.OnAfterQueryExecute(actionContext, queryable, result);
                result = modifiedResult.Result;
                userData = modifiedResult.UserData;
            }
            if (contextHandler != null) {
                var modifiedResult = contextHandler.OnAfterQueryExecute(actionContext, queryable, result);
                result = modifiedResult.Result;
                userData = modifiedResult.UserData;
            }
            return new ProcessResult { Result = result, InlineCount = inlineCount, UserData = userData };
        }

        /// <summary>
        /// Checks the result count.
        /// </summary>
        /// <param name="queryable">The queryable.</param>
        /// <param name="maxResultCount">The maximum result count.</param>
        private static void CheckResultCount(IQueryable queryable, int maxResultCount) {
            var count = Queryable.Count((dynamic) queryable);
            if (count > maxResultCount)
                throw new BeetleException(Resources.ResultCountExceeded);
        }

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
        public virtual HandledQuery HandleQuery(IQueryable query, IEnumerable<KeyValuePair<string, string>> parameters) {
            var inlineCount = false;
            IQueryable inlineCountQuery = null;
            foreach (var prm in parameters) {
                switch (prm.Key) {
                    case "inlinecount":
                        inlineCount = prm.Value == "allpages";
                        break;
                    case "oftype":
                        inlineCountQuery = null;
                        query = HandleOfType(query, prm.Value);
                        break;
                    case "filter":
                        inlineCountQuery = null;
                        query = HandleWhere(query, prm.Value);
                        break;
                    case "orderby":
                        query = HandleOrderBy(query, prm.Value);
                        break;
                    case "expand":
                        query = HandleInclude(query, prm.Value);
                        break;
                    case "select":
                        query = HandleSelect(query, prm.Value);
                        break;
                    case "skip":
                        if (inlineCountQuery == null)
                            inlineCountQuery = query;
                        query = HandleSkip(query, Convert.ToInt32(prm.Value));
                        break;
                    case "top":
                    case "take":
                        if (inlineCountQuery == null)
                            inlineCountQuery = query;
                        query = HandleTake(query, Convert.ToInt32(prm.Value));
                        break;
                    case "groupby":
                        inlineCountQuery = null;
                        var prms = prm.Value.Split(';');
                        if (prms.Length > 2) throw new BeetleException(string.Format(Resources.InvalidGroupByExpression, prm.Value));
                        var keySelector = prms[0];
                        var valueSelector = prms.Length == 2 ? prms[1] : null;
                        query = HandleGroupBy(query, keySelector, valueSelector);
                        break;
                    case "distinct":
                        inlineCountQuery = null;
                        query = HandleDistinct(query, prm.Value);
                        break;
                    case "reverse":
                        query = HandleReverse(query);
                        break;
                    case "selectMany":
                        inlineCountQuery = null;
                        query = HandleSelectMany(query, prm.Value);
                        break;
                    case "skipWhile":
                        if (inlineCountQuery == null)
                            inlineCountQuery = query;
                        query = HandleSkipWhile(query, prm.Value);
                        break;
                    case "takeWhile":
                        if (inlineCountQuery == null)
                            inlineCountQuery = query;
                        query = HandleTakeWhile(query, prm.Value);
                        break;
                    default:
                        throw new BeetleException(string.Format(Resources.UnknownBeetleQueryParameter, prm.Key));
                }
            }

            return new HandledQuery(query, inlineCount ? (inlineCountQuery ?? query) : null);
        }

        /// <summary>
        /// Handles executer expression (any, all, first, single etc..).
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="executer">The executer expression.</param>
        /// <returns></returns>
        /// <exception cref="BeetleException">Invalid group by expression:  + prm.Value
        /// or
        /// Unknown beetle query parameter:  + prm.Key</exception>
        public virtual object HandleExecuter(IQueryable query, KeyValuePair<string, string> executer) {
            var exp = executer.Key.Substring(executer.Key.IndexOf(';') + 1);
            switch (exp) {
                case "all":
                    return HandleAll(query, executer.Value);
                case "any":
                    return HandleAny(query, executer.Value);
                case "avg":
                    return HandleAvg(query, executer.Value);
                case "max":
                    return HandleMax(query, executer.Value);
                case "min":
                    return HandleMin(query, executer.Value);
                case "sum":
                    return HandleSum(query, executer.Value);
                case "count":
                    return HandleCount(query, executer.Value);
                case "first":
                    return HandleFirst(query, executer.Value);
                case "firstOD":
                    return HandleFirstOrDefault(query, executer.Value);
                case "single":
                    return HandleSingle(query, executer.Value);
                case "singleOD":
                    return HandleSingleOrDefault(query, executer.Value);
                case "last":
                    return HandleLast(query, executer.Value);
                case "lastOD":
                    return HandleLastOrDefault(query, executer.Value);
                default:
                    throw new BeetleException(string.Format(Resources.UnknownBeetleQueryExecuterParameter, executer.Key));
            }
        }

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
        public virtual IQueryable HandleOfType(IQueryable query, string ofType) {
            if (string.IsNullOrWhiteSpace(ofType)) return query;

            var elementType = query.GetType().GetGenericArguments().FirstOrDefault();
            if (elementType == null) throw new ArgumentException(Resources.CannotChangeQueryType);

            // use this type's namespace and assembly information to find wanted type
            var ofTypeFullName = string.Format("{0}.{1}, {2}", elementType.Namespace, ofType, elementType.Assembly.GetName());
            var ofTypeType = Type.GetType(ofTypeFullName);
            if (ofTypeType == null)
                throw new ArgumentException(string.Format(Resources.CannotFindTypeInformation, ofTypeFullName));

            // call Queryable's OfType method
            var mi = typeof(Queryable).GetMethod("OfType");
            var gmi = mi.MakeGenericMethod(ofTypeType);
            query = (IQueryable)gmi.Invoke(null, new object[] { query });
            return query;
        }

        /// <summary>
        /// Handles the where (filter) query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="filter">The filter.</param>
        /// <returns></returns>
        public virtual IQueryable HandleWhere(IQueryable query, string filter) {
            if (string.IsNullOrWhiteSpace(filter)) return query;

            return query.Where(filter);
        }

        /// <summary>
        /// Handles the order by query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="orderBy">The order by.</param>
        /// <returns></returns>
        public virtual IQueryable HandleOrderBy(IQueryable query, string orderBy) {
            if (string.IsNullOrWhiteSpace(orderBy)) return query;

            return query.OrderBy(orderBy);
        }

        /// <summary>
        /// Handles the include (expand) query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="expand">The expand.</param>
        /// <returns></returns>
        public virtual IQueryable HandleInclude(IQueryable query, string expand) {
            if (string.IsNullOrWhiteSpace(expand)) return query;

            var dynQuery = (dynamic)query;
            expand.Split(',').ToList()
                .ForEach(e => { dynQuery = dynQuery.Include(e.Trim()); });
            return dynQuery;
        }

        /// <summary>
        /// Handles the select query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="projection">The projection.</param>
        /// <returns></returns>
        public virtual IQueryable HandleSelect(IQueryable query, string projection) {
            if (string.IsNullOrWhiteSpace(projection)) return query;

            return query.Select(projection.Contains(',') ? string.Format("New({0})", projection) : projection);
        }

        /// <summary>
        /// Handles the distinct query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="count">The count.</param>
        /// <returns></returns>
        public virtual IQueryable HandleSkip(IQueryable query, int count) {
            return query.Skip(count);
        }

        /// <summary>
        /// Handles the distinct query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="count">The count.</param>
        /// <returns></returns>
        public virtual IQueryable HandleTake(IQueryable query, int count) {
            return query.Take(count);
        }

        /// <summary>
        /// Handles the group by query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="keySelector">The key selector.</param>
        /// <param name="elementSelector">The element selector.</param>
        /// <returns></returns>
        public virtual IQueryable HandleGroupBy(IQueryable query, string keySelector, string elementSelector) {
            if (!string.IsNullOrWhiteSpace(keySelector))
                query = query.GroupBy(keySelector.Contains(',') ? string.Format("New({0})", keySelector) : keySelector, "it");

            if (string.IsNullOrWhiteSpace(elementSelector))
                return query.Select("New(Key, it as Items)");
            return query.Select(elementSelector.Contains(',') ? string.Format("New({0})", elementSelector) : elementSelector);
        }

        /// <summary>
        /// Handles the distinct query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="elementSelector">The element selector.</param>
        /// <returns></returns>
        public virtual IQueryable HandleDistinct(IQueryable query, string elementSelector) {
            if (!string.IsNullOrWhiteSpace(elementSelector))
                query = HandleSelect(query, elementSelector);
            return Queryable.Distinct((dynamic)query);
        }

        /// <summary>
        /// Handles the distinct query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <returns></returns>
        public virtual IQueryable HandleReverse(IQueryable query) {
            return Queryable.Reverse((dynamic)query);
        }

        /// <summary>
        /// Handles the selectMany query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="projection">The projection.</param>
        /// <returns></returns>
        public virtual IQueryable HandleSelectMany(IQueryable query, string projection) {
            if (string.IsNullOrWhiteSpace(projection)) return query;

            return query.SelectMany(projection);
        }

        /// <summary>
        /// Handles the selectWhile query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        public virtual IQueryable HandleSkipWhile(IQueryable query, string predicate) {
            return query.SkipWhile(predicate);
        }

        /// <summary>
        /// Handles the takeWhile query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        public virtual IQueryable HandleTakeWhile(IQueryable query, string predicate) {
            return query.TakeWhile(predicate);
        }

        /// <summary>
        /// Handles the all query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        public virtual bool HandleAll(IQueryable query, string predicate) {
            return query.All(predicate);
        }

        /// <summary>
        /// Handles the any query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        public virtual bool HandleAny(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = HandleWhere(query, predicate);
            return query.Any();
        }

        /// <summary>
        /// Handles the avg query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="elementSelector">The element selector.</param>
        /// <returns></returns>
        public virtual object HandleAvg(IQueryable query, string elementSelector) {
            if (!string.IsNullOrWhiteSpace(elementSelector))
                query = query.Select(elementSelector);
            return Queryable.Average((dynamic)query);
        }

        /// <summary>
        /// Handles the max query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="elementSelector">The element selector.</param>
        /// <returns></returns>
        public virtual object HandleMax(IQueryable query, string elementSelector) {
            if (!string.IsNullOrWhiteSpace(elementSelector))
                query = query.Select(elementSelector);
            return Queryable.Max((dynamic)query);
        }

        /// <summary>
        /// Handles the max query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="elementSelector">The element selector.</param>
        /// <returns></returns>
        public virtual object HandleMin(IQueryable query, string elementSelector) {
            if (!string.IsNullOrWhiteSpace(elementSelector))
                query = query.Select(elementSelector);
            return Queryable.Min((dynamic)query);
        }

        /// <summary>
        /// Handles the sum query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="elementSelector">The element selector.</param>
        /// <returns></returns>
        public virtual object HandleSum(IQueryable query, string elementSelector) {
            if (!string.IsNullOrWhiteSpace(elementSelector))
                query = query.Select(elementSelector);
            return Queryable.Sum((dynamic)query);
        }

        /// <summary>
        /// Handles the count query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        public virtual object HandleCount(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = HandleWhere(query, predicate);
            return Queryable.Count((dynamic)query);
        }

        /// <summary>
        /// Handles the first query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        public virtual object HandleFirst(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = HandleWhere(query, predicate);
            return Queryable.First((dynamic)query);
        }

        /// <summary>
        /// Handles the firstOrDefault query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        public virtual object HandleFirstOrDefault(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = HandleWhere(query, predicate);
            return Queryable.FirstOrDefault((dynamic)query);
        }

        /// <summary>
        /// Handles the single query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        public virtual object HandleSingle(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = HandleWhere(query, predicate);
            return Queryable.Single((dynamic)query);
        }

        /// <summary>
        /// Handles the singleOrDefault query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        public virtual object HandleSingleOrDefault(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = HandleWhere(query, predicate);
            return Queryable.SingleOrDefault((dynamic)query);
        }

        /// <summary>
        /// Handles the last query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        public virtual object HandleLast(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = HandleWhere(query, predicate);
            return Queryable.Last((dynamic)query);
        }

        /// <summary>
        /// Handles the lastOrDefault query parameter.
        /// </summary>
        /// <param name="query">The query.</param>
        /// <param name="predicate">The predicate.</param>
        /// <returns></returns>
        public virtual object HandleLastOrDefault(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = HandleWhere(query, predicate);
            return Queryable.LastOrDefault((dynamic)query);
        }

        /// <summary>
        /// Gets the single instance.
        /// </summary>
        /// <value>
        /// The instance.
        /// </value>
        public static QueryableHandler Instance { get { return _instance.Value; } }
    }
}
