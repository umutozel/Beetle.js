using System.Collections.Generic;
using Beetle.Server.Meta;

namespace Beetle.Server {

    public class EntityBag {

        public EntityBag(object clientEntity, object entity, EntityState entityState, 
                         IDictionary<string, object> originalValues, int index, bool? forceUpdate = null) {
            _clientEntity = clientEntity;
            _entity = entity;
            _entityState = entityState;
            _originalValues = originalValues ?? new Dictionary<string, object>();
            _index = index;
            ForceUpdate = forceUpdate == true;
        }

        public EntityBag(object clientEntity, object entity, EntityState entityState, IDictionary<string, object> originalValues,
                         int index, EntityType entityType, bool? forceUpdate = null)
            : this(clientEntity, entity, entityState, originalValues, index, forceUpdate) {
            EntityType = entityType;
        }

        private readonly object _clientEntity;
        public object ClientEntity { get { return _clientEntity; } }

        private readonly object _entity;
        public object Entity { get { return _entity; } }

        private readonly EntityState _entityState;
        public EntityState EntityState { get { return _entityState; } }

        private readonly IDictionary<string, object> _originalValues;
        public IDictionary<string, object> OriginalValues { get { return _originalValues; }}

        private readonly int _index;

        public int Index { get { return _index; } }

        /// <summary>
        /// Gets a value indicating whether [force update] when there is no modified property.
        /// </summary>
        public bool ForceUpdate { get; set; }

        /// <summary>
        /// Gets or sets the type of the entity.
        /// Added for performance.
        /// </summary>
        public EntityType EntityType { get; set; }
    }
}