using System.Collections.Generic;
using System.Linq;
using Beetle.Server.Meta;

namespace Beetle.Server {

    public interface IContextHandler<out TContext> {

        /// <summary>
        /// Creates the context.
        /// </summary>
        /// <returns></returns>
        TContext CreateContext();

        /// <summary>
        /// Gets the entity framework context.
        /// </summary>
        /// <value>
        /// The context.
        /// </value>
        TContext Context { get; }
    }

    /// <summary>
    /// Context handler common interface.
    /// </summary>
    public interface IContextHandler {

        /// <summary>
        /// Return metadata about data structure.
        /// </summary>
        /// <returns>Metadata object.</returns>
        Metadata Metadata();

        /// <summary>
        /// Initializes this instance.
        /// </summary>
        void Initialize();

        /// <summary>
        /// Handles the unknown action.
        /// </summary>
        /// <param name="action">The action.</param>
        /// <returns></returns>
        object HandleUnknownAction(string action);

        /// <summary>
        /// Creates the type by name.
        /// </summary>
        /// <param name="typeName">Name of the type.</param>
        /// <returns></returns>
        /// <exception cref="System.ArgumentException"></exception>
        object CreateType(string typeName);

        /// <summary>
        /// Handles the unmapped objects (which does not mapped to persistence layer, like DTOs or Proxies).
        /// </summary>
        /// <param name="unmappeds">The unmapped objects.</param>
        IEnumerable<EntityBag> HandleUnmappeds(IEnumerable<EntityBag> unmappeds);

        /// <summary>
        /// Saves the changes.
        /// </summary>
        /// <param name="entities">The entities.</param>
        /// <returns>
        /// Save result.
        /// </returns>
        SaveResult SaveChanges(IEnumerable<EntityBag> entities);

        /// <summary>
        /// Gets query handler.
        /// </summary>
        QueryableHandler QueryableHandler { get; }

        /// <summary>
        /// Processes the request.
        /// </summary>
        /// <param name="contentValue">The content value.</param>
        /// <param name="queryParameters">The query parameters.</param>
        /// <param name="actionContext">The action context.</param>
        /// <param name="service">The service.</param>
        /// <returns></returns>
        ProcessResult ProcessRequest(object contentValue, IEnumerable<KeyValuePair<string, string>> queryParameters, ActionContext actionContext, IBeetleService service);

        /// <summary>
        /// Occurs when [before handle query].
        /// </summary>
        event BeforeQueryExecuteDelegate BeforeHandleQuery;

        /// <summary>
        /// Called when [before handle query].
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        /// <returns></returns>
        BeforeQueryExecuteEventArgs OnBeforeHandleQuery(ActionContext actionContext, IQueryable query);

        /// <summary>
        /// Occurs when [before execute query].
        /// </summary>
        event BeforeQueryExecuteDelegate BeforeQueryExecute;

        /// <summary>
        /// Called when [before query execute].
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        /// <returns></returns>
        BeforeQueryExecuteEventArgs OnBeforeQueryExecute(ActionContext actionContext, IQueryable query);

        /// <summary>
        /// Occurs when [after execute query].
        /// </summary>
        event AfterQueryExecuteDelegate AfterQueryExecute;

        /// <summary>
        /// Called when [after query execute].
        /// </summary>
        /// <param name="actionContext">The action context.</param>
        /// <param name="query">The query.</param>
        /// <param name="result">The result.</param>
        /// <returns></returns>
        AfterQueryExecuteEventArgs OnAfterQueryExecute(ActionContext actionContext, IQueryable query, object result);

        /// <summary>
        /// Occurs before save.
        /// </summary>
        event ContextSaveDelegate BeforeSaveChanges;

        /// <summary>
        /// Occurs after save.
        /// </summary>
        event ContextSaveDelegate AfterSaveChanges;
    }
}
