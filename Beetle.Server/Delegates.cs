using System;
using System.Collections.Generic;
using System.Linq;

namespace Beetle.Server {

    /// <summary>
    /// Holds query execution event args.
    /// </summary>
    public class BeforeQueryExecuteEventArgs : EventArgs {
        private readonly ActionContext _actionContext;

        /// <summary>
        /// Initializes a new instance of the <see cref="BeforeQueryExecuteEventArgs" /> class.
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        public BeforeQueryExecuteEventArgs(ActionContext actionContext, IQueryable query) {
            _actionContext = actionContext;
            Query = query;
        }

        /// <summary>
        /// Gets the action.
        /// </summary>
        /// <value>
        /// The action.
        /// </value>
        public ActionContext ActionContext {
            get { return _actionContext; }
        }

        /// <summary>
        /// Gets or sets the query.
        /// </summary>
        /// <value>
        /// The query.
        /// </value>
        public IQueryable Query { get; set; }
    }

    /// <summary>
    /// Fired before query execution.
    /// </summary>
    /// <param name="sender">The sender.</param>
    /// <param name="eventArgs">The <see cref="BeforeQueryExecuteEventArgs"/> instance containing the event data.</param>
    public delegate void BeforeQueryExecuteDelegate(object sender, BeforeQueryExecuteEventArgs eventArgs);

    /// <summary>
    /// Holds query and result event args.
    /// </summary>
    public class AfterQueryExecuteEventArgs : EventArgs {
        private readonly ActionContext _actionContext;
        private readonly IQueryable _query;

        /// <summary>
        /// Initializes a new instance of the <see cref="AfterQueryExecuteEventArgs" /> class.
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        /// <param name="result">The result.</param>
        public AfterQueryExecuteEventArgs(ActionContext actionContext, IQueryable query, object result) {
            _actionContext = actionContext;
            _query = query;
            Result = result;
            UserData = null;
        }

        /// <summary>
        /// Gets the action.
        /// </summary>
        /// <value>
        /// The action.
        /// </value>
        public ActionContext ActionContext {
            get { return _actionContext; }
        }

        /// <summary>
        /// Gets the query.
        /// </summary>
        /// <value>
        /// The query.
        /// </value>
        public IQueryable Query {
            get { return _query; }
        }

        /// <summary>
        /// Gets the result.
        /// </summary>
        /// <value>
        /// The result.
        /// </value>
        public object Result { get; set; }

        /// <summary>
        /// Gets the user data.
        /// </summary>
        /// <value>
        /// The user data.
        /// </value>
        public string UserData { get; set; }
    }

    /// <summary>
    /// Fired after a query is executed.
    /// </summary>
    /// <param name="sender">The sender.</param>
    /// <param name="eventArgs">The <see cref="AfterQueryExecuteEventArgs"/> instance containing the event data.</param>
    public delegate void AfterQueryExecuteDelegate(object sender, AfterQueryExecuteEventArgs eventArgs);

    /// <summary>
    /// Holds context save event args.
    /// </summary>
    public class ServiceSaveEventArgs : EventArgs {
        private readonly IEnumerable<EntityBag> _entities;

        /// <summary>
        /// Initializes a new instance of the <see cref="ServiceSaveEventArgs"/> class.
        /// </summary>
        /// <param name="entities">The entities.</param>
        public ServiceSaveEventArgs(IEnumerable<EntityBag> entities) {
            _entities = entities;
        }

        /// <summary>
        /// Gets the entities.
        /// </summary>
        /// <value>
        /// The entities.
        /// </value>
        public IEnumerable<EntityBag> Entities {
            get { return _entities; }
        }
    }

    /// <summary>
    /// Fired before and after context save.
    /// </summary>
    /// <param name="sender">The sender.</param>
    /// <param name="eventArgs">The <see cref="ServiceSaveEventArgs"/> instance containing the event data.</param>
    public delegate void ServiceSaveDelegate(object sender, ServiceSaveEventArgs eventArgs);

    /// <summary>
    /// Holds context save event args.
    /// </summary>
    public class ContextSaveEventArgs : EventArgs {
        private readonly IEnumerable<EntityBag> _entities;

        /// <summary>
        /// Initializes a new instance of the <see cref="ContextSaveEventArgs"/> class.
        /// </summary>
        /// <param name="entities">The entities.</param>
        public ContextSaveEventArgs(IEnumerable<EntityBag> entities) {
            _entities = entities;
        }

        /// <summary>
        /// Gets the entities.
        /// </summary>
        /// <value>
        /// The entities.
        /// </value>
        public IEnumerable<EntityBag> Entities {
            get { return _entities; }
        }
    }

    /// <summary>
    /// Fired before and after context save.
    /// </summary>
    /// <param name="sender">The sender.</param>
    /// <param name="eventArgs">The <see cref="ContextSaveEventArgs"/> instance containing the event data.</param>
    public delegate void ContextSaveDelegate(object sender, ContextSaveEventArgs eventArgs);
}
