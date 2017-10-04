using System.Collections.Generic;

namespace Beetle.Server.Interface {

    public interface IQueryHandler<T>: IContentHandler<T> {

        HandledQuery HandleQuery(T query, IEnumerable<BeetleParameter> parameters);

        object HandleExecuter(T query, BeetleParameter executer);

        T OfType(T query, string ofType);

        T Where(T query, string filter);

        T OrderBy(T query, string orderBy);

        T Include(T query, string expand);

        T Select(T query, string projection);

        T Skip(T query, int count);

        T Take(T query, int count);

        T GroupBy(T query, string keySelector, string elementSelector);

        T Distinct(T query, string elementSelector);

        T Reverse(T query);

        T SelectMany(T query, string projection);

        T SkipWhile(T query, string predicate);

        T TakeWhile(T query, string predicate);

        bool All(T query, string predicate);

        bool Any(T query, string predicate);

        object Avg(T query, string elementSelector);

        object Max(T query, string elementSelector);

        object Min(T query, string elementSelector);

        object Sum(T query, string elementSelector);

        object Count(T query, string predicate);

        object First(T query, string predicate);

        object FirstOrDefault(T query, string predicate);

        object Single(T query, string predicate);

        object SingleOrDefault(T query, string predicate);

        object Last(T query, string predicate);

        object LastOrDefault(T query, string predicate);
    }
}
