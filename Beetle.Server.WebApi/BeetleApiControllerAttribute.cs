using Beetle.Server.WebApi.Properties;
using System;
using System.Net.Http.Formatting;
using System.Net.Http.Headers;
using System.Text;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;
using System.Web.Http.OData.Query;

namespace Beetle.Server.WebApi {

    /// <summary>
    /// Configure the Web API settings
    /// </summary>
    [AttributeUsage(AttributeTargets.Class)]
    public class BeetleApiControllerAttribute : Attribute, IControllerConfiguration {
        private static readonly object _locker = new object();
        private readonly BeetleConfig _beetleConfig;
        private readonly BeetleQueryableAttribute _queryableFilter;

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleApiControllerAttribute" /> class.
        /// </summary>
        /// <param name="configType">Type of the config.</param>
        /// <exception cref="System.ArgumentException">Cannot create config instance.</exception>
        public BeetleApiControllerAttribute(Type configType = null)
            : this(new BeetleQueryableAttribute(configType), configType) {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="BeetleApiControllerAttribute"/> class.
        /// </summary>
        /// <param name="defaultFilter">The default filter.</param>
        /// <param name="configType">Type of the config.</param>
        /// <exception cref="System.ArgumentException">Cannot create config instance.</exception>
        public BeetleApiControllerAttribute(BeetleQueryableAttribute defaultFilter, Type configType = null) {
            if (configType != null) {
                _beetleConfig = Activator.CreateInstance(configType) as BeetleConfig;
                if (_beetleConfig == null)
                    throw new ArgumentException(Resources.CannotCreateConfigInstance);
            }
            else _beetleConfig = BeetleConfig.Instance;

            _queryableFilter = defaultFilter;
        }

        /// <summary>
        /// Initializes the specified settings.
        /// </summary>
        /// <param name="settings">The settings.</param>
        /// <param name="descriptor">The descriptor.</param>
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

        /// <summary>
        /// Return the IQueryable <see cref="IFilterProvider"/> for a Beetle Controller
        /// </summary>
        /// <remarks>
        /// By default returns an <see cref="BeetleQueryableFilterProvider"/>.
        /// Override to substitute a custom provider.
        /// </remarks>
        protected virtual IFilterProvider GetQueryableFilterProvider(BeetleQueryableAttribute defaultFilter) {
            return new BeetleQueryableFilterProvider(defaultFilter);
        }

        /// <summary>
        /// Gets the beetle config.
        /// </summary>
        /// <value>
        /// The beetle config.
        /// </value>
        protected virtual BeetleConfig BeetleConfig {
            get { return _beetleConfig; }
        }

        #region Exposed Queryable Filter Properties

        /// <summary>
        /// Gets or sets a value indicating whether [enable constant parameterization].
        /// </summary>
        /// <value>
        /// <c>true</c> if [enable constant parameterization]; otherwise, <c>false</c>.
        /// </value>
        public bool EnableConstantParameterization {
            get { return _queryableFilter.EnableConstantParameterization; }
            set { _queryableFilter.EnableConstantParameterization = value; }
        }

        /// <summary>
        /// Gets or sets a value indicating whether [ensure stable ordering].
        /// </summary>
        /// <value>
        /// <c>true</c> if [ensure stable ordering]; otherwise, <c>false</c>.
        /// </value>
        public bool EnsureStableOrdering {
            get { return _queryableFilter.EnsureStableOrdering; }
            set { _queryableFilter.EnsureStableOrdering = value; }
        }

        /// <summary>
        /// Gets or sets the handle null propagation.
        /// </summary>
        /// <value>
        /// The handle null propagation.
        /// </value>
        public HandleNullPropagationOption HandleNullPropagation {
            get { return _queryableFilter.HandleNullPropagation; }
            set { _queryableFilter.HandleNullPropagation = value; }
        }

        /// <summary>
        /// Gets or sets the max any all expression depth.
        /// </summary>
        /// <value>
        /// The max any all expression depth.
        /// </value>
        public int MaxAnyAllExpressionDepth {
            get { return _queryableFilter.MaxAnyAllExpressionDepth; }
            set { _queryableFilter.MaxAnyAllExpressionDepth = value; }
        }

        /// <summary>
        /// Gets or sets the max node count.
        /// </summary>
        /// <value>
        /// The max node count.
        /// </value>
        public int MaxNodeCount {
            get { return _queryableFilter.MaxNodeCount; }
            set { _queryableFilter.MaxNodeCount = value; }
        }

        /// <summary>
        /// Gets or sets the size of the page.
        /// </summary>
        /// <value>
        /// The size of the page.
        /// </value>
        public int PageSize {
            get { return _queryableFilter.PageSize; }
            set { _queryableFilter.PageSize = value; }
        }

        /// <summary>
        /// Gets or sets the allowed query options.
        /// </summary>
        /// <value>
        /// The allowed query options.
        /// </value>
        public AllowedQueryOptions AllowedQueryOptions {
            get { return _queryableFilter.AllowedQueryOptions; }
            set { _queryableFilter.AllowedQueryOptions = value; }
        }

        /// <summary>
        /// Gets or sets the allowed functions.
        /// </summary>
        /// <value>
        /// The allowed functions.
        /// </value>
        public AllowedFunctions AllowedFunctions {
            get { return _queryableFilter.AllowedFunctions; }
            set { _queryableFilter.AllowedFunctions = value; }
        }

        /// <summary>
        /// Gets or sets the allowed arithmetic operators.
        /// </summary>
        /// <value>
        /// The allowed arithmetic operators.
        /// </value>
        public AllowedArithmeticOperators AllowedArithmeticOperators {
            get { return _queryableFilter.AllowedArithmeticOperators; }
            set { _queryableFilter.AllowedArithmeticOperators = value; }
        }

        /// <summary>
        /// Gets or sets the allowed logical operators.
        /// </summary>
        /// <value>
        /// The allowed logical operators.
        /// </value>
        public AllowedLogicalOperators AllowedLogicalOperators {
            get { return _queryableFilter.AllowedLogicalOperators; }
            set { _queryableFilter.AllowedLogicalOperators = value; }
        }

        /// <summary>
        /// Gets or sets the allowed order by properties.
        /// </summary>
        /// <value>
        /// The allowed order by properties.
        /// </value>
        public string AllowedOrderByProperties {
            get { return _queryableFilter.AllowedOrderByProperties; }
            set { _queryableFilter.AllowedOrderByProperties = value; }
        }

        /// <summary>
        /// Gets or sets the max skip.
        /// </summary>
        /// <value>
        /// The max skip.
        /// </value>
        public int MaxSkip {
            get { return _queryableFilter.MaxSkip; }
            set { _queryableFilter.MaxSkip = value; }
        }

        /// <summary>
        /// Gets or sets the max top.
        /// </summary>
        /// <value>
        /// The max top.
        /// </value>
        public int MaxTop {
            get { return _queryableFilter.MaxTop; }
            set { _queryableFilter.MaxTop = value; }
        }

        #endregion
    }
}
