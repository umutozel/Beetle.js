using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;
using System.Web.Http.OData.Query;

namespace Beetle.Server.WebApi {

    public class BeetleQueryableFilterProvider : IFilterProvider {

        public BeetleQueryableFilterProvider(BeetleQueryableAttribute filter) {
            _filter = filter;
        }

        public IEnumerable<FilterInfo> GetFilters(HttpConfiguration configuration, HttpActionDescriptor actionDescriptor) {
            if (actionDescriptor == null ||
                (!IsIQueryable(actionDescriptor.ReturnType)) ||
                actionDescriptor.GetCustomAttributes<QueryableAttribute>().Any() ||
                actionDescriptor.GetParameters().Any(parameter => typeof (ODataQueryOptions).IsAssignableFrom(parameter.ParameterType)))
                return Enumerable.Empty<FilterInfo>();

            return new[] {new FilterInfo(_filter, FilterScope.Global)};
        }

        public static bool IsIQueryable(Type type) {
            if (type == typeof(IQueryable)) return true;
            if (type != null && type.IsGenericType)
                return type.GetGenericTypeDefinition() == typeof (IQueryable<>);
            return false;
        }

        private readonly BeetleQueryableAttribute _filter;
    }
}