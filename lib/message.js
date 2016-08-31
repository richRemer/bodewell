/**
 * Create a message.
 * @param {string} message
 */
function Message(message) {
    if (!(this instanceof Message)) {
        return new Message(message);
    }

    var lines = message.split("\n");

    if (lines.length > 1) {
        this.title = lines[0];
        this.body = lines.slice(1).join("\n");
    } else {
        this.title = lines[0];
        this.body = lines[0];
    }
}

/**
 * @name Message#title
 * @type {string}
 * @readonly
 */
Message.prototype.title = "";

/**
 * @name Message#body
 * @type {string}
 * @readonly
 */
Message.prototype.body = "";

module.exports = Message;
