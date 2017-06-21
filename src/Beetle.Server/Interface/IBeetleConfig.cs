using System.Collections;
using System.Linq;

namespace Beetle.Server.Interface {

    public interface IBeetleConfig {

        ISerializer Serializer { get; }

        /// <summary>
        /// Exclusive query handler instance.
        /// Will be used even if ContextHandler has one. 
        /// When not null, we are saying "Use this handler for this config (action) no matter what".
        /// </summary>
        IQueryHandler<IQueryable> QueryableHandler { get; }

        /// <summary>
        /// Exclusive enumerable handler instance.
        /// Will be used even if ContextHandler has one. 
        /// When not null, we are saying "Use this handler for this config (action) no matter what".
        /// </summary>
        IContentHandler<IEnumerable> EnumerableHandler { get; }
    }
}
