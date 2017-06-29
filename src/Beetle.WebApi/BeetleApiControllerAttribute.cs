using System;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;
using System.Web.Http.OData.Query;
using System.Net.Http.Formatting;

namespace Beetle.WebApi {
    using Server.Interface;
    using Properties;

    [AttributeUsage(AttributeTargets.Class)]
    public class BeetleApiControllerAttribute : Attribute, IControllerConfiguration {
        private static readonly object _locker = new object();
        private readonly IBeetleConfig _beetleConfig;
        private readonly BeetleQueryableAttribute _queryableFilter;

        public BeetleApiControllerAttribute(Type configType = null)
            : this(new BeetleQueryableAttribute(configType), configType) {
        }

        public BeetleApiControllerAttribute(BeetleQueryableAttribute defaultFilter, Type configType = null) {
            if (configType != null) {
                _beetleConfig = Activator.CreateInstance(configType) as IBeetleConfig;
                if (_beetleConfig == null)
                    throw new ArgumentException(Resources.CannotCreateConfigInstance);
            }

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
            return Helper.CreateFormatter(_beetleConfig);
        }

        protected virtual IFilterProvider GetQueryableFilterProvider(BeetleQueryableAttribute defaultFilter) {
            return new BeetleQueryableFilterProvider(defaultFilter);
        }

        protected virtual IBeetleConfig BeetleConfig => _beetleConfig;

        #region Exposed Queryable Filter Properties

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

        public int MaxNodeCount {
            get => _queryableFilter.MaxNodeCount;
            set => _queryableFilter.MaxNodeCount = value;
        }

        public int PageSize {
            get => _queryableFilter.PageSize;
            set => _queryableFilter.PageSize = value;
        }

        public AllowedQueryOptions AllowedQueryOptions {
            get => _queryableFilter.AllowedQueryOptions;
            set => _queryableFilter.AllowedQueryOptions = value;
        }

        public AllowedFunctions AllowedFunctions {
            get => _queryableFilter.AllowedFunctions;
            set => _queryableFilter.AllowedFunctions = value;
        }

        public AllowedArithmeticOperators AllowedArithmeticOperators {
            get => _queryableFilter.AllowedArithmeticOperators;
            set => _queryableFilter.AllowedArithmeticOperators = value;
        }

        public AllowedLogicalOperators AllowedLogicalOperators {
            get => _queryableFilter.AllowedLogicalOperators;
            set => _queryableFilter.AllowedLogicalOperators = value;
        }

        public string AllowedOrderByProperties {
            get => _queryableFilter.AllowedOrderByProperties;
            set => _queryableFilter.AllowedOrderByProperties = value;
        }

        public int MaxSkip {
            get => _queryableFilter.MaxSkip;
            set => _queryableFilter.MaxSkip = value;
        }

        public int MaxTop {
            get => _queryableFilter.MaxTop;
            set => _queryableFilter.MaxTop = value;
        }

        #endregion
    }
}
