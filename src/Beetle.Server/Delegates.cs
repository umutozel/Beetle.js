using System;
using System.Collections.Generic;
using System.Linq;

namespace Beetle.Server {

    public class BeforeQueryExecuteEventArgs : EventArgs {

        /// <summary>
        /// Initializes a new instance of the <see cref="BeforeQueryExecuteEventArgs" /> class.
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        public BeforeQueryExecuteEventArgs(ActionContext actionContext, IQueryable query) {
            ActionContext = actionContext;
            Query = query;
        }

        /// <summary>
        /// Gets the action.
        /// </summary>
        /// <value>
        /// The action.
        /// </value>
        public ActionContext ActionContext { get; }

        /// <summary>
        /// Gets or sets the query.
        /// </summary>
        /// <value>
        /// The query.
        /// </value>
        public IQueryable Query { get; set; }

        /// <summary>
        /// Gets the user data.
        /// </summary>
        /// <value>
        /// The user data.
        /// </value>
        public string UserData { get; set; }
    }

    public delegate void BeforeQueryExecuteDelegate(object sender, BeforeQueryExecuteEventArgs eventArgs);

    public class AfterQueryExecuteEventArgs : EventArgs {
        /// <summary>
        /// Initializes a new instance of the <see cref="AfterQueryExecuteEventArgs" /> class.
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        /// <param name="result">The result.</param>
        /// <param name="userData">The user data.</param>
        public AfterQueryExecuteEventArgs(ActionContext actionContext, IQueryable query, object result, object userData) {
            ActionContext = actionContext;
            Query = query;
            Result = result;
            UserData = userData;
        }

        /// <summary>
        /// Gets the action.
        /// </summary>
        /// <value>
        /// The action.
        /// </value>
        public ActionContext ActionContext { get; }

        /// <summary>
        /// Gets the query.
        /// </summary>
        /// <value>
        /// The query.
        /// </value>
        public IQueryable Query { get; }

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
        public object UserData { get; set; }
    }

    public delegate void AfterQueryExecuteDelegate(object sender, AfterQueryExecuteEventArgs eventArgs);

    public class BeforeSaveEventArgs : EventArgs {
        /// <summary>
        /// Initializes a new instance of the <see cref="BeforeSaveEventArgs" /> class.
        /// </summary>
        /// <param name="entities">The entities.</param>
        /// <param name="saveContext">The save context.</param>
        public BeforeSaveEventArgs(IEnumerable<EntityBag> entities, SaveContext saveContext) {
            Entities = entities;
            SaveContext = saveContext;
        }

        /// <summary>
        /// Gets the entities.
        /// </summary>
        /// <value>
        /// The entities.
        /// </value>
        public IEnumerable<EntityBag> Entities { get; }

        /// <summary>
        /// Gets the save context.
        /// </summary>
        /// <value>
        /// The save context.
        /// </value>
        public SaveContext SaveContext { get; }
    }

    public delegate void BeforeSaveDelegate(object sender, BeforeSaveEventArgs eventArgs);

    public class AfterSaveEventArgs : EventArgs {
        /// <summary>
        /// Initializes a new instance of the <see cref="AfterSaveEventArgs" /> class.
        /// </summary>
        /// <param name="entities">The entities.</param>
        /// <param name="saveResult">The save result.</param>
        public AfterSaveEventArgs(IEnumerable<EntityBag> entities, SaveResult saveResult) {
            Entities = entities;
            SaveResult = saveResult;
        }

        /// <summary>
        /// Gets the entities.
        /// </summary>
        /// <value>
        /// The entities.
        /// </value>
        public IEnumerable<EntityBag> Entities { get; }

        /// <summary>
        /// Gets the save result.
        /// </summary>
        /// <value>
        /// The save result.
        /// </value>
        public SaveResult SaveResult { get; }
    }

    public delegate void AfterSaveDelegate(object sender, AfterSaveEventArgs eventArgs);
}
