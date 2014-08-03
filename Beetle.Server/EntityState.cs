using System;

namespace Beetle.Server {

    /// <summary>
    /// Entity states. Same as Entity Framework enum, but duplicated for abstraction.
    /// </summary>
    [Flags]
    public enum EntityState {
        /// <summary>
        /// The detached state
        /// </summary>
        Detached = 1,
        /// <summary>
        /// The unchanged state
        /// </summary>
        Unchanged = 2,
        /// <summary>
        /// The added state
        /// </summary>
        Added = 4,
        /// <summary>
        /// The deleted state
        /// </summary>
        Deleted = 8,
        /// <summary>
        /// The modified state
        /// </summary>
        Modified = 16,
    }
}
