/**
 * Create a keyed entity class.
 * @param {function} config
 * @returns {function}
 */
function keyed(config) {
    var entities = {};

    function KeyedEntity(id) {
        var args = Array.prototype.slice.call(arguments, 1),
            entity;

        if (id in entities) {
            entity = entities[id];
        } else {
            entity = Object.create(KeyedEntity.prototype);
            entities[id] = entity;

            Object.defineProperty(entity, "id", {
                configurable: false,
                enumerable: true,
                writable: false,
                value: String(id)
            });
        }

        config.apply(entity, args);
        return entity;
    }

    /**
     * Select keyed entities.  New entities may be created to fulfill the
     * request if the key is unknown.
     * @param {string[]} keys
     * @returns {Set<Contact>}
     */
    KeyedEntity.select = function(keys) {
        return keys.map(k => entities[k] || KeyedEntity(k));
    };

    /**
     * @name KeyedEntity#id
     * @type {string}
     * @readonly
     */
    KeyedEntity.prototype.id = "";

    /**
     * Purge the entity from the entity cache.
     */
    KeyedEntity.prototype.purge = function() {
        if (entities[id] === this) delete entities[id];
        Object.freeze(this);
    };

    return KeyedEntity;
}

module.exports = keyed;
