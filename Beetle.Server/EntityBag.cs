using System.Collections.Generic;
using Beetle.Server.Meta;

namespace Beetle.Server {

    /// <summary>
    /// Holds client entity information.
    /// </summary>
    public class EntityBag {

        /// <summary>
        /// Initializes a new instance of the <see cref="EntityBag" /> class.
        /// </summary>
        /// <param name="clientEntity">The entity before serialization.</param>
        /// <param name="entity">The entity.</param>
        /// <param name="entityState">State of the entity.</param>
        /// <param name="originalValues">The original values.</param>
        /// <param name="index">The index in the client array.</param>
        /// <param name="forceUpdate">if set to <c>true</c> [force update].</param>
        public EntityBag(object clientEntity, object entity, EntityState entityState, 
                         IDictionary<string, object> originalValues, int index, bool? forceUpdate = null) {
            _clientEntity = clientEntity;
            _entity = entity;
            _entityState = entityState;
            _originalValues = originalValues ?? new Dictionary<string, object>();
            _index = index;
            ForceUpdate = forceUpdate == true;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="EntityBag" /> class.
        /// </summary>
        /// <param name="clientEntity">The client entity.</param>
        /// <param name="entity">The entity.</param>
        /// <param name="entityState">State of the entity.</param>
        /// <param name="originalValues">The original values.</param>
        /// <param name="index">The index.</param>
        /// <param name="entityType">Type of the entity.</param>
        /// <param name="forceUpdate">The force update.</param>
        public EntityBag(object clientEntity, object entity, EntityState entityState, IDictionary<string, object> originalValues,
                         int index, EntityType entityType, bool? forceUpdate = null)
            : this(clientEntity, entity, entityState, originalValues, index, forceUpdate) {
            EntityType = entityType;
        }

        private readonly object _clientEntity;
        /// <summary>
        /// Gets the rawEntity.
        /// </summary>
        /// <value>
        /// The rawEntity.
        /// </value>
        public object ClientEntity { get { return _clientEntity; } }

        private readonly object _entity;
        /// <summary>
        /// Gets the entity.
        /// </summary>
        /// <value>
        /// The entity.
        /// </value>
        public object Entity { get { return _entity; } }

        private readonly EntityState _entityState;
        /// <summary>
        /// Gets the state of the entity.
        /// </summary>
        /// <value>
        /// The state of the entity.
        /// </value>
        public EntityState EntityState { get { return _entityState; } }

        private readonly IDictionary<string, object> _originalValues;
        /// <summary>
        /// Gets the original values.
        /// </summary>
        /// <value>
        /// The original values.
        /// </value>
        public IDictionary<string, object> OriginalValues { get { return _originalValues; }}

        private readonly int _index;

        /// <summary>
        /// Gets the index.
        /// </summary>
        /// <value>
        /// The index.
        /// </value>
        public int Index { get { return _index; } }

        /// <summary>
        /// Gets a value indicating whether [force update] when there is no modified property.
        /// </summary>
        /// <value>
        ///   <c>true</c> if [force update]; otherwise, <c>false</c>.
        /// </value>
        public bool ForceUpdate { get; set; }

        /// <summary>
        /// Gets or sets the type of the entity.
        /// Added for performance considerations.
        /// </summary>
        /// <value>
        /// The type of the entity.
        /// </value>
        public EntityType EntityType { get; set; }
    }
}