using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Beetle.Server.Meta;

namespace Beetle.Server {

    public interface IContextHandler<out TContext>: IContextHandler {

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
        /// Initializes this instance.
        /// </summary>
        void Initialize();

        /// <summary>
        /// Return metadata about data structure.
        /// </summary>
        /// <returns>Metadata object.</returns>
        Metadata Metadata();

        /// <summary>
        /// Creates the type by name.
        /// </summary>
        /// <param name="typeName">Name of the type.</param>
        /// <returns></returns>
        /// <exception cref="System.ArgumentException"></exception>
        object CreateType(string typeName);

        /// <summary>
        /// Handles the unknown action.
        /// </summary>
        /// <param name="action">The action.</param>
        /// <returns></returns>
        object HandleUnknownAction(string action);

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
        /// Handles the unmapped objects (which does not mapped to persistence layer, like DTOs or Proxies).
        /// </summary>
        /// <param name="unmappeds">The unmapped objects.</param>
        IEnumerable<EntityBag> HandleUnmappeds(IEnumerable<EntityBag> unmappeds);

        /// <summary>
        /// Saves the changes.
        /// </summary>
        /// <param name="entities">The entities.</param>
        /// <param name="saveContext">The save context.</param>
        /// <returns>
        /// Save result.
        /// </returns>
        SaveResult SaveChanges(IEnumerable<EntityBag> entities, SaveContext saveContext);

        /// <summary>
        /// Gets the enumerable handler.
        /// </summary>
        /// <value>
        /// The enumerable handler.
        /// </value>
        IContentHandler<IEnumerable> EnumerableHandler { get; }

        /// <summary>
        /// Gets query handler.
        /// </summary>
        IQueryHandler<IQueryable> QueryableHandler { get; }

        /// <summary>
        /// Occurs when [before handle query].
        /// </summary>
        event BeforeQueryExecuteDelegate BeforeHandleQuery;

        /// <summary>
        /// Called when [before handle query].
        /// </summary>
        /// <param name="args">Before query execute event arguments.</param>
        void OnBeforeHandleQuery(BeforeQueryExecuteEventArgs args);

        /// <summary>
        /// Occurs when [before execute query].
        /// </summary>
        event BeforeQueryExecuteDelegate BeforeQueryExecute;

        /// <summary>
        /// Called when [before query execute].
        /// </summary>
        /// <param name="args">Before query execute event arguments.</param>
        void OnBeforeQueryExecute(BeforeQueryExecuteEventArgs args);

        /// <summary>
        /// Occurs when [after execute query].
        /// </summary>
        event AfterQueryExecuteDelegate AfterQueryExecute;

        /// <summary>
        /// Called when [after query execute].
        /// </summary>
        /// <param name="args">After query execute event arguments.</param>
        void OnAfterQueryExecute(AfterQueryExecuteEventArgs args);

        /// <summary>
        /// Occurs before save.
        /// </summary>
        event BeforeSaveDelegate BeforeSaveChanges;

        /// <summary>
        /// Occurs after save.
        /// </summary>
        event AfterSaveDelegate AfterSaveChanges;
    }
}
