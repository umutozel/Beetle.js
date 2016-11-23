using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;
using System.Web.Http.OData.Query;

namespace Beetle.Server.WebApi {

    /// <summary>
    /// Provides Queryable filters for Controller
    /// </summary>
    public class BeetleQueryableFilterProvider : IFilterProvider {

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleQueryableFilterProvider" /> class.
        /// </summary>
        /// <param name="filter">The filter.</param>
        public BeetleQueryableFilterProvider(BeetleQueryableAttribute filter) {
            _filter = filter;
        }

        /// <summary>
        /// Returns an enumeration of filters.
        /// </summary>
        /// <param name="configuration">The HTTP configuration.</param>
        /// <param name="actionDescriptor">The action descriptor.</param>
        /// <returns>
        /// An enumeration of filters.
        /// </returns>
        public IEnumerable<FilterInfo> GetFilters(HttpConfiguration configuration, HttpActionDescriptor actionDescriptor) {
            if (actionDescriptor == null ||
                (!IsIQueryable(actionDescriptor.ReturnType)) ||
                actionDescriptor.GetCustomAttributes<QueryableAttribute>().Any() ||
                actionDescriptor.GetParameters().Any(parameter => typeof (ODataQueryOptions).IsAssignableFrom(parameter.ParameterType)))
                return Enumerable.Empty<FilterInfo>();

            return new[] {new FilterInfo(_filter, FilterScope.Global)};
        }

        /// <summary>
        /// Determines whether the specified type is IQueryable.
        /// </summary>
        /// <param name="type">The type.</param>
        /// <returns>
        ///   <c>true</c> if the specified type is IQueryable; otherwise, <c>false</c>.
        /// </returns>
        public static bool IsIQueryable(Type type) {
            if (type == typeof(IQueryable)) return true;
            if (type != null && type.IsGenericType)
                return type.GetGenericTypeDefinition() == typeof (IQueryable<>);
            return false;
        }

        private readonly BeetleQueryableAttribute _filter;
    }
}