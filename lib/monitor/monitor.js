var EventEmitter = require("events").EventEmitter;

/**
 * Monitor object.
 * @constructor
 * @augments {EventEmitter}
 * @param {function} cancel
 */
function Monitor(cancel) {
    EventEmitter.call(this);
    Object.defineProperty(this, "cancel", {configurable: true, value: cancel});
}

Monitor.prototype = Object.create(EventEmitter.prototype);

Object.defineProperties(Monitor.prototype, {
    /**
     * @name Monitor#state
     * @type {string}
     * @readonly
     */
    state: {
        configurable: true,
        enumerable: true,
        writable: false,
        value: "initial"
    },

    cancel: {
        configurable: true,
        enumerable: false,
        writable: false,
        value: function() {}
    }
});

/**
 * Exit failed state.
 */
Monitor.prototype.clear = function() {
    var emit = this.state === "failed";
    Object.defineProperty(this, "state", {configurable: true, value: "ok"});
    if (emit) this.emit("cleared");
};

/**
 * Enter failed state.
 * @param {object} data
 */
Monitor.prototype.fail = function(data) {
    var alert = this.state !== "failed";
    Object.defineProperty(this, "state", {configurable: true, value: "failed"});
    if (alert) this.emit("alert", data);
    this.emit("failure", data);
};

/**
 * Generate an alert.
 * @param {object} data
 */
Monitor.prototype.alert = function(data) {
    this.emit("alert", data);
};

/**
 * Terminate the monitor.
 */
Monitor.prototype.terminate = function() {
    this.cancel();
    Object.freeze(this);
};

/**
 * Write to monitor log.
 * @param {...string} args
 */
Monitor.prototype.log = function(args) {
    if (this.console) {
        this.console.log.apply(this.console, arguments);
    }
};

/**
 * Write to monitor error log.
 * @param {...string} args
 */
Monitor.prototype.error = function(args) {
    if (this.console) {
        this.console.error.apply(this.console, arguments);
    }
};

/**
 * Write to monitor debug log.
 * @param {...string} args
 */
Monitor.prototype.debug = function(args) {
    if (this.console) {
        this.console.debug.apply(this.console, arguments);
    }
};

/**
 * Create a Monitor.
 * @param {function} cancel
 * @param {Console} [console]
 * @returns {Monitor}
 */
function monitor(cancel, console) {
    var monitor = new Monitor(cancel);
    monitor.console = console;
    return monitor;
}

module.exports = monitor;
