using System.Collections.Generic;

namespace Beetle.Server {

    /// <summary>
    /// Beetle server service common interface.
    /// </summary>
    public interface IBeetleService<out TContextHandler>: IBeetleService where TContextHandler: IContextHandler {

        /// <summary>
        /// Creates the context handler.
        /// </summary>
        /// <returns></returns>
        TContextHandler CreateContextHandler();

        /// <summary>
        /// Gets the context handler.
        /// </summary>
        /// <returns></returns>
        new TContextHandler ContextHandler { get; }
    }

    /// <summary>
    /// Beetle server service common base interface.
    /// </summary>
    public interface IBeetleService {

        /// <summary>
        /// Gets metadata for the service.
        /// </summary>
        /// <returns></returns>
        object Metadata();

        /// <summary>
        /// Creates the type by given name.
        /// </summary>
        /// <param name="typeName">Name of the type.</param>
        /// <param name="initialValues">The initial values (serialized).</param>
        /// <returns></returns>
        object CreateType(string typeName, string initialValues);

        /// <summary>
        /// Processes the request.
        /// </summary>
        /// <param name="contentValue">The content value.</param>
        /// <param name="actionContext">The action context.</param>
        /// <returns></returns>
        ProcessResult ProcessRequest(object contentValue, ActionContext actionContext);

        /// <summary>
        /// Handles the unknowns objects (which does not have $type).
        /// </summary>
        /// <param name="unknowns">The unknown objects.</param>
        IEnumerable<EntityBag> HandleUnknowns(IEnumerable<EntityBag> unknowns);

        /// <summary>
        /// Saves the changes.
        /// </summary>
        /// <param name="saveBundle">The save bundle.</param>
        /// <returns></returns>
        SaveResult SaveChanges(object saveBundle);

        /// <summary>
        /// The beetle configuration
        /// </summary>
        /// <value>
        /// The beetle configuration.
        /// </value>
        BeetleConfig BeetleConfig { get; }

        /// <summary>
        /// Gets the context handler.
        /// </summary>
        IContextHandler ContextHandler { get; }

        /// <summary>
        /// Gets the maximum result count.
        /// </summary>
        /// <value>
        /// The maximum result count.
        /// </value>
        int MaxResultCount { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether [check request hash].
        /// </summary>
        /// <value>
        ///   <c>true</c> if [check request hash]; otherwise, <c>false</c>.
        /// </value>
        bool CheckRequestHash { get; set; }

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
