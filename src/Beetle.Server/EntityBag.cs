using System.Collections.Generic;

namespace Beetle.Server {
    using Meta;

    public class EntityBag {

        public EntityBag(object clientEntity, object entity, EntityState entityState, 
                         IDictionary<string, object> originalValues, int index, bool? forceUpdate = null) {
            ClientEntity = clientEntity;
            Entity = entity;
            EntityState = entityState;
            OriginalValues = originalValues ?? new Dictionary<string, object>();
            Index = index;
            ForceUpdate = forceUpdate == true;
        }

        public EntityBag(object clientEntity, object entity, EntityState entityState, IDictionary<string, object> originalValues,
                         int index, EntityType entityType, bool? forceUpdate = null)
            : this(clientEntity, entity, entityState, originalValues, index, forceUpdate) {
            EntityType = entityType;
        }

        public object ClientEntity { get; }

        public object Entity { get; }

        public EntityState EntityState { get; }

        public IDictionary<string, object> OriginalValues { get; }

        public int Index { get; }

        /// <summary>
        /// Gets a value indicating whether [force update] when there is no modified property.
        /// </summary>
        public bool ForceUpdate { get; set; }

        /// <summary>
        /// Gets or sets the type of the entity.
        /// Added to improve performance.
        /// </summary>
        public EntityType EntityType { get; set; }
    }
}