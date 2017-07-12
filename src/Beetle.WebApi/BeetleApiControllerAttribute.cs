using System;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;
using System.Web.Http.OData.Query;
using System.Net.Http.Formatting;

namespace Beetle.WebApi {

    [AttributeUsage(AttributeTargets.Class)]
    public class BeetleApiControllerAttribute : Attribute, IControllerConfiguration {
        private static readonly object _locker = new object();
        private readonly BeetleQueryableAttribute _queryableFilter;

        public BeetleApiControllerAttribute() : this(new BeetleApiConfig()) {
        }

        public BeetleApiControllerAttribute(IBeetleApiConfig config)
            : this(new BeetleQueryableAttribute(config)) {
        }

        public BeetleApiControllerAttribute(BeetleQueryableAttribute defaultFilter) {
            _queryableFilter = defaultFilter;
        }

        public void Initialize(HttpControllerSettings settings, HttpControllerDescriptor descriptor) {
            lock (_locker) {
                // Add queryable filter provider
                settings.Services.RemoveAll(typeof(IFilterProvider), f => f is BeetleQueryableFilterProvider);
                settings.Services.Add(typeof(IFilterProvider), GetQueryableFilterProvider(_queryableFilter));

                // add Json Formatter
                settings.Formatters.Remove(settings.Formatters.JsonFormatter);
                settings.Formatters.Add(CreateFormatter());
            }
        }

        protected virtual MediaTypeFormatter CreateFormatter() {
            return _queryableFilter.Config.CreateFormatter();
        }

        protected virtual IFilterProvider GetQueryableFilterProvider(BeetleQueryableAttribute defaultFilter) {
            _queryableFilter.

            return new BeetleQueryableFilterProvider(defaultFilter);
        }

        #region Exposed Queryable Filter Properties

        public AllowedArithmeticOperators AllowedArithmeticOperators {
            get => _queryableFilter.AllowedArithmeticOperators;
            set => _queryableFilter.AllowedArithmeticOperators = value;
        }

        public AllowedFunctions AllowedFunctions {
            get => _queryableFilter.AllowedFunctions;
            set => _queryableFilter.AllowedFunctions = value;
        }

        public AllowedLogicalOperators AllowedLogicalOperators {
            get => _queryableFilter.AllowedLogicalOperators;
            set => _queryableFilter.AllowedLogicalOperators = value;
        }

        public string AllowedOrderByProperties {
            get => _queryableFilter.AllowedOrderByProperties;
            set => _queryableFilter.AllowedOrderByProperties = value;
        }

        public AllowedQueryOptions AllowedQueryOptions {
            get => _queryableFilter.AllowedQueryOptions;
            set => _queryableFilter.AllowedQueryOptions = value;
        }

        public bool EnableConstantParameterization {
            get => _queryableFilter.EnableConstantParameterization;
            set => _queryableFilter.EnableConstantParameterization = value;
        }

        public bool EnsureStableOrdering {
            get => _queryableFilter.EnsureStableOrdering;
            set => _queryableFilter.EnsureStableOrdering = value;
        }

        public HandleNullPropagationOption HandleNullPropagation {
            get => _queryableFilter.HandleNullPropagation;
            set => _queryableFilter.HandleNullPropagation = value;
        }

        public int MaxAnyAllExpressionDepth {
            get => _queryableFilter.MaxAnyAllExpressionDepth;
            set => _queryableFilter.MaxAnyAllExpressionDepth = value;
        }

        public int MaxExpansionDepth {
            get => _queryableFilter.MaxExpansionDepth;
            set => _queryableFilter.MaxExpansionDepth = value;
        }

        public int MaxNodeCount {
            get => _queryableFilter.MaxNodeCount;
            set => _queryableFilter.MaxNodeCount = value;
        }

        public int MaxOrderByNodeCount {
            get => _queryableFilter.MaxOrderByNodeCount;
            set => _queryableFilter.MaxOrderByNodeCount = value;
        }

        public int MaxSkip {
            get => _queryableFilter.MaxSkip;
            set => _queryableFilter.MaxSkip = value;
        }

        public int MaxTop {
            get => _queryableFilter.MaxTop;
            set => _queryableFilter.MaxTop = value;
        }

        public int PageSize {
            get => _queryableFilter.PageSize;
            set => _queryableFilter.PageSize = value;
        }

        #endregion
    }
}
