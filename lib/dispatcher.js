var keyed = require("./keyed-entity");

const implementation = Symbol("implementation");

/**
 * @class Dispatcher.
 * @augments KeyedEntity
 * @param {string} id
 * @param {function} impl
 */
const Dispatcher = keyed(function(impl) {
    this[implementation] = impl;
});

/**
 * Dispatch message to a contact.
 * @param {Contact} contact
 * @param {Message} message
 */
Dispatcher.prototype.dispatch = function(contact, message) {
    this[implementation](contact, message);
};

module.exports = Dispatcher;
