using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic;
using System.Reflection;

namespace Beetle.Server {
    using Interface;
    using Properties;
    
    public class QueryableHandler : IQueryHandler<IQueryable> {
        private static readonly Lazy<QueryableHandler> _instance = new Lazy<QueryableHandler>(() => new QueryableHandler());

        public virtual ProcessResult HandleContent(IQueryable queryable, ActionContext actionContext) {
            if (queryable == null) throw new ArgumentNullException(nameof(queryable));

            var service = actionContext.Service;
            var contextHandler = service?.ContextHandler;
            object result;
            int? inlineCount = null;

            // make before handle event callbacks
            var beforeArgs = new BeforeQueryExecuteEventArgs(actionContext, queryable);
            service?.OnBeforeHandleQuery(beforeArgs);
            contextHandler?.OnBeforeHandleQuery(beforeArgs);
            queryable = beforeArgs.Query;

            var parameters = actionContext.Parameters;
            if (parameters != null) {
                var parameterList = parameters as IList<BeetleParameter> ?? parameters.ToList();
                var executer = parameterList.SingleOrDefault(b => b.Name.StartsWith("exec;"));
                if (executer != null) {
                    parameterList.Remove(executer);
                }

                // handle query
                var handledQuery = HandleQuery(queryable, parameterList);
                beforeArgs.Query = handledQuery.Query;

                // make before execute callbacks
                service?.OnBeforeQueryExecute(beforeArgs);
                contextHandler?.OnBeforeQueryExecute(beforeArgs);
                queryable = beforeArgs.Query;

                // get in-line count
                if (handledQuery.InlineCountQuery != null) {
                    inlineCount = Queryable.Count((dynamic)handledQuery.InlineCountQuery);
                }

                // execute query
                if (executer != null) {
                    result = HandleExecuter(queryable, executer);
                }
                else {
                    queryable = ValidateQuery(actionContext, queryable, handledQuery.TakeCount, service, contextHandler);
                    result = Enumerable.ToList((dynamic)queryable);
                }
            }
            else {
                // make before execute callbacks
                service?.OnBeforeQueryExecute(beforeArgs);
                contextHandler?.OnBeforeQueryExecute(beforeArgs);
                queryable = beforeArgs.Query;

                queryable = ValidateQuery(actionContext, queryable, null, service, contextHandler);
                result = Enumerable.ToList((dynamic)queryable);
            }

            // make after execute callbacks
            var afterArgs = new AfterQueryExecuteEventArgs(actionContext, queryable, result, beforeArgs.UserData);
            service?.OnAfterQueryExecute(afterArgs);
            contextHandler?.OnAfterQueryExecute(afterArgs);
            result = afterArgs.Result;
            var userData = afterArgs.UserData;

            return new ProcessResult(actionContext) { Result = result, InlineCount = inlineCount, UserData = userData };
        }

        protected virtual IQueryable ValidateQuery(ActionContext actionContext, IQueryable queryable, int? takeCount, 
                                                   IBeetleService service, IContextHandler contextHandler) {
            var maxResultCount = actionContext.MaxResultCount ?? service?.MaxResultCount;
            if (maxResultCount > 0 && (takeCount == null || takeCount > maxResultCount)) {
                var count = Queryable.Count((dynamic)queryable);
                if (count > maxResultCount)
                    throw new BeetleException(Resources.ResultCountExceeded);
            }

            return queryable;
        }

        public virtual HandledQuery HandleQuery(IQueryable query, IEnumerable<BeetleParameter> parameters) {
            var inlineCount = false;
            int? takeCount = null;
            IQueryable inlineCountQuery = null;
            foreach (var prm in parameters) {
                switch (prm.Name.ToLowerInvariant()) {
                    case "inlinecount":
                        inlineCount = prm.Value == "allpages";
                        break;
                    case "oftype":
                        inlineCountQuery = null;
                        query = OfType(query, prm.Value);
                        break;
                    case "filter":
                    case "where":
                        inlineCountQuery = null;
                        query = Where(query, prm.Value);
                        break;
                    case "orderby":
                        query = OrderBy(query, prm.Value);
                        break;
                    case "expand":
                    case "include":
                        query = Include(query, prm.Value);
                        break;
                    case "select":
                        query = Select(query, prm.Value);
                        break;
                    case "skip":
                        if (inlineCountQuery == null)
                            inlineCountQuery = query;
                        query = Skip(query, Convert.ToInt32(prm.Value));
                        break;
                    case "top":
                    case "take":
                        if (inlineCountQuery == null)
                            inlineCountQuery = query;
                        var take = Convert.ToInt32(prm.Value);
                        query = Take(query, take);
                        takeCount = take;
                        break;
                    case "groupby":
                        inlineCountQuery = null;
                        var prms = prm.Value.Split(';');
                        if (prms.Length > 2) throw new BeetleException(string.Format(Resources.InvalidGroupByExpression, prm.Value));
                        var keySelector = prms[0];
                        var valueSelector = prms.Length == 2 ? prms[1] : null;
                        query = GroupBy(query, keySelector, valueSelector);
                        break;
                    case "distinct":
                        inlineCountQuery = null;
                        query = Distinct(query, prm.Value);
                        break;
                    case "reverse":
                        query = Reverse(query);
                        break;
                    case "selectmany":
                        inlineCountQuery = null;
                        takeCount = null;
                        query = SelectMany(query, prm.Value);
                        break;
                    case "skipwhile":
                        if (inlineCountQuery == null)
                            inlineCountQuery = query;
                        query = SkipWhile(query, prm.Value);
                        break;
                    case "takewhile":
                        if (inlineCountQuery == null)
                            inlineCountQuery = query;
                        query = TakeWhile(query, prm.Value);
                        break;
                    default:
                        throw new BeetleException(string.Format(Resources.UnknownBeetleQueryParameter, prm.Name));
                }
            }

            return new HandledQuery(query, inlineCount ? (inlineCountQuery ?? query) : null, takeCount);
        }

        /// <summary>
        /// Handles executer expression (any, all, first, single etc..).
        /// </summary>
        /// <exception cref="BeetleException">
        /// Invalid group by expression:  + prm.Value
        /// or
        /// Unknown beetle query parameter:  + prm.Key
        /// </exception>
        public virtual object HandleExecuter(IQueryable query, BeetleParameter executer) {
            var exp = executer.Name.Substring(executer.Name.IndexOf(';') + 1);
            switch (exp.ToLowerInvariant()) {
                case "all":
                    return All(query, executer.Value);
                case "any":
                    return Any(query, executer.Value);
                case "avg":
                    return Avg(query, executer.Value);
                case "max":
                    return Max(query, executer.Value);
                case "min":
                    return Min(query, executer.Value);
                case "sum":
                    return Sum(query, executer.Value);
                case "count":
                    return Count(query, executer.Value);
                case "first":
                    return First(query, executer.Value);
                case "firstod":
                    return FirstOrDefault(query, executer.Value);
                case "single":
                    return Single(query, executer.Value);
                case "singleod":
                    return SingleOrDefault(query, executer.Value);
                case "last":
                    return Last(query, executer.Value);
                case "lastod":
                    return LastOrDefault(query, executer.Value);
                default:
                    throw new BeetleException(string.Format(Resources.UnknownBeetleQueryExecuterParameter, executer.Name));
            }
        }

        public virtual IQueryable OfType(IQueryable query, string ofType) {
            if (string.IsNullOrWhiteSpace(ofType)) return query;

            var elementType = query.GetType().GetGenericArguments().FirstOrDefault();
            if (elementType == null) throw new ArgumentException(Resources.CannotChangeQueryType);

            // use this type's namespace and assembly information to find wanted type
            var ofTypeFullName = string.Format("{0}.{1}, {2}", elementType.Namespace, ofType, elementType.GetTypeInfo().Assembly.GetName());
            var ofTypeType = Type.GetType(ofTypeFullName);
            if (ofTypeType == null)
                throw new ArgumentException(string.Format(Resources.CannotFindTypeInformation, ofTypeFullName));

            // call Queryable's OfType method
            var mi = typeof(Queryable).GetMethod("OfType");
            var gmi = mi.MakeGenericMethod(ofTypeType);
            query = (IQueryable)gmi.Invoke(null, new object[] { query });
            return query;
        }

        public virtual IQueryable Where(IQueryable query, string filter) {
            if (string.IsNullOrWhiteSpace(filter)) return query;

            return query.Where(filter);
        }

        public virtual IQueryable OrderBy(IQueryable query, string orderBy) {
            if (string.IsNullOrWhiteSpace(orderBy)) return query;

            return query.OrderBy(orderBy);
        }

        public virtual IQueryable Include(IQueryable query, string expand) {
            if (string.IsNullOrWhiteSpace(expand)) return query;

            var dynQuery = (dynamic)query;
            expand.Split(',').ToList()
                .ForEach(e => { dynQuery = dynQuery.Include(e.Trim()); });
            return dynQuery;
        }

        public virtual IQueryable Select(IQueryable query, string projection) {
            if (string.IsNullOrWhiteSpace(projection)) return query;

            return projection.Contains(",") || projection.Contains(" as ") ? query.Select(string.Format("New({0})", projection)) : query.Select(projection);
        }

        public virtual IQueryable Skip(IQueryable query, int count) {
            return query.Skip(count);
        }

        public virtual IQueryable Take(IQueryable query, int count) {
            return query.Take(count);
        }

        public virtual IQueryable GroupBy(IQueryable query, string keySelector, string elementSelector) {
            if (string.IsNullOrWhiteSpace(keySelector))
                keySelector = "true";
            else if (keySelector.Contains(",") || keySelector.Contains(" as "))
                keySelector = string.Format("New({0})", keySelector);
            query = query.GroupBy(keySelector, "it");

            if (string.IsNullOrWhiteSpace(elementSelector))
                elementSelector = "New(Key, it as Items)";
            else if (elementSelector.Contains(",") || elementSelector.Contains(" as "))
                elementSelector = string.Format("New({0})", elementSelector);
            return query.Select(elementSelector);
        }

        public virtual IQueryable Distinct(IQueryable query, string elementSelector) {
            if (!string.IsNullOrWhiteSpace(elementSelector))
                query = Select(query, elementSelector);
            return Queryable.Distinct((dynamic)query);
        }

        public virtual IQueryable Reverse(IQueryable query) {
            return Queryable.Reverse((dynamic)query);
        }

        public virtual IQueryable SelectMany(IQueryable query, string projection) {
            if (string.IsNullOrWhiteSpace(projection)) return query;

            return query.SelectMany(projection);
        }

        public virtual IQueryable SkipWhile(IQueryable query, string predicate) {
            return query.SkipWhile(predicate);
        }

        public virtual IQueryable TakeWhile(IQueryable query, string predicate) {
            return query.TakeWhile(predicate);
        }

        public virtual bool All(IQueryable query, string predicate) {
            return query.All(predicate);
        }

        public virtual bool Any(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = Where(query, predicate);
            return query.Any();
        }

        public virtual object Avg(IQueryable query, string elementSelector) {
            if (!string.IsNullOrWhiteSpace(elementSelector))
                query = query.Select(elementSelector);
            return Queryable.Average((dynamic)query);
        }

        public virtual object Max(IQueryable query, string elementSelector) {
            if (!string.IsNullOrWhiteSpace(elementSelector))
                query = query.Select(elementSelector);
            return Queryable.Max((dynamic)query);
        }

        public virtual object Min(IQueryable query, string elementSelector) {
            if (!string.IsNullOrWhiteSpace(elementSelector))
                query = query.Select(elementSelector);
            return Queryable.Min((dynamic)query);
        }

        public virtual object Sum(IQueryable query, string elementSelector) {
            if (!string.IsNullOrWhiteSpace(elementSelector))
                query = query.Select(elementSelector);
            return Queryable.Sum((dynamic)query);
        }

        public virtual object Count(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = Where(query, predicate);
            return Queryable.Count((dynamic)query);
        }

        public virtual object First(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = Where(query, predicate);
            return Queryable.First((dynamic)query);
        }

        public virtual object FirstOrDefault(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = Where(query, predicate);
            return Queryable.FirstOrDefault((dynamic)query);
        }

        public virtual object Single(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = Where(query, predicate);
            return Queryable.Single((dynamic)query);
        }

        public virtual object SingleOrDefault(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = Where(query, predicate);
            return Queryable.SingleOrDefault((dynamic)query);
        }

        public virtual object Last(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = Where(query, predicate);
            return Queryable.Last((dynamic)query);
        }

        public virtual object LastOrDefault(IQueryable query, string predicate) {
            if (!string.IsNullOrWhiteSpace(predicate))
                query = Where(query, predicate);
            return Queryable.LastOrDefault((dynamic)query);
        }

        public static IQueryHandler<IQueryable> Instance => _instance.Value;
    }
}
