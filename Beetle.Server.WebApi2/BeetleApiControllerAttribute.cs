using Beetle.Server.WebApi.Properties;
using System;
using System.Net.Http.Headers;
using System.Text;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;
using System.Web.Http.OData.Query;

namespace Beetle.Server.WebApi {

    [AttributeUsage(AttributeTargets.Class)]
    public class BeetleApiControllerAttribute : Attribute, IControllerConfiguration {
        private static readonly object _locker = new object();
        private readonly BeetleConfig _beetleConfig;
        private readonly BeetleQueryableAttribute _queryableFilter;

        public BeetleApiControllerAttribute(Type configType = null)
            : this(new BeetleQueryableAttribute(configType), configType) {
        }

        public BeetleApiControllerAttribute(BeetleQueryableAttribute defaultFilter, Type configType = null) {
            if (configType != null) {
                _beetleConfig = Activator.CreateInstance(configType) as BeetleConfig;
                if (_beetleConfig == null)
                    throw new ArgumentException(Resources.CannotCreateConfigInstance);
            }
            else _beetleConfig = BeetleConfig.Instance;

            _queryableFilter = defaultFilter;
        }

        public void Initialize(HttpControllerSettings settings, HttpControllerDescriptor descriptor) {
            lock (_locker) {
                // Add queryable filter provider
                settings.Services.RemoveAll(typeof(IFilterProvider), f => f is BeetleQueryableFilterProvider);
                settings.Services.Add(typeof(IFilterProvider), GetQueryableFilterProvider(_queryableFilter));

                // add Json Formatter
                settings.Formatters.Remove(settings.Formatters.JsonFormatter);
                var formatter = new BeetleMediaTypeFormatter { SerializerSettings = _beetleConfig.JsonSerializerSettings };
                formatter.SupportedMediaTypes.Add(new MediaTypeHeaderValue("application/json"));
                formatter.SupportedEncodings.Add(new UTF8Encoding(false, true));
                settings.Formatters.Add(formatter);
            }
        }

        protected virtual IFilterProvider GetQueryableFilterProvider(BeetleQueryableAttribute defaultFilter) {
            return new BeetleQueryableFilterProvider(defaultFilter);
        }

        protected virtual BeetleConfig BeetleConfig {
            get { return _beetleConfig; }
        }

        #region Exposed Queryable Filter Properties

        public bool EnableConstantParameterization {
            get { return _queryableFilter.EnableConstantParameterization; }
            set { _queryableFilter.EnableConstantParameterization = value; }
        }

        public bool EnsureStableOrdering {
            get { return _queryableFilter.EnsureStableOrdering; }
            set { _queryableFilter.EnsureStableOrdering = value; }
        }

        public HandleNullPropagationOption HandleNullPropagation {
            get { return _queryableFilter.HandleNullPropagation; }
            set { _queryableFilter.HandleNullPropagation = value; }
        }

        public int MaxAnyAllExpressionDepth {
            get { return _queryableFilter.MaxAnyAllExpressionDepth; }
            set { _queryableFilter.MaxAnyAllExpressionDepth = value; }
        }

        public int MaxNodeCount {
            get { return _queryableFilter.MaxNodeCount; }
            set { _queryableFilter.MaxNodeCount = value; }
        }

        public int PageSize {
            get { return _queryableFilter.PageSize; }
            set { _queryableFilter.PageSize = value; }
        }

        public AllowedQueryOptions AllowedQueryOptions {
            get { return _queryableFilter.AllowedQueryOptions; }
            set { _queryableFilter.AllowedQueryOptions = value; }
        }

        public AllowedFunctions AllowedFunctions {
            get { return _queryableFilter.AllowedFunctions; }
            set { _queryableFilter.AllowedFunctions = value; }
        }

        public AllowedArithmeticOperators AllowedArithmeticOperators {
            get { return _queryableFilter.AllowedArithmeticOperators; }
            set { _queryableFilter.AllowedArithmeticOperators = value; }
        }

        public AllowedLogicalOperators AllowedLogicalOperators {
            get { return _queryableFilter.AllowedLogicalOperators; }
            set { _queryableFilter.AllowedLogicalOperators = value; }
        }

        public string AllowedOrderByProperties {
            get { return _queryableFilter.AllowedOrderByProperties; }
            set { _queryableFilter.AllowedOrderByProperties = value; }
        }

        public int MaxSkip {
            get { return _queryableFilter.MaxSkip; }
            set { _queryableFilter.MaxSkip = value; }
        }

        public int MaxTop {
            get { return _queryableFilter.MaxTop; }
            set { _queryableFilter.MaxTop = value; }
        }

        #endregion
    }
}
