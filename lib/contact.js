var keyed = require("./keyed-entity");

/**
 * @class Contact
 * @augments KeyedEntity
 * @param {string} id
 * @param {object} [opts]
 */
module.exports = keyed(function(opts) {
    Object.keys(opts || {}).map(k => this[k] = opts[k]);
});

