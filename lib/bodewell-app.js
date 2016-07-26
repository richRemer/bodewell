var monitorType = require("./monitor/monitor-type");

/**
 * Bodewell application object.
 * @constructor
 * @param {object} [opts]
 * @param {object.<string,object>} [opts.monitor]
 */
function BodewellApp(opts) {
    var monitors,
        name;

    opts = opts || {};
    monitors = opts.monitor || {};

    Object.defineProperty(this, "monitors", {configurable: true, value: {}});
    Object.freeze(this.monitors);

    for (var name in monitors) {
        this.monitor(name, monitors[name]);
    }
}

Object.defineProperties(BodewellApp.prototype, {
    /**
     * @name BodewellApp#monitors
     * @type {object.<string,Monitor>}
     * @readonly
     */
    monitors: {
        configurable: true,
        enumerable: true,
        writable: false,
        value: null
    }
});

/**
 * Configure a monitor.
 * @param {string} name
 * @param {object} opts
 * @param {string} opts.type
 */
BodewellApp.prototype.monitor = function(name, opts) {
    var type = opts.type,
        monitors = {},
        monitor, key,
        create;

    if (!type) throw new TypeError("missing monitor type");

    create = monitorType(type);
    if (!create) throw new Error(`unrecognized monitor type '${type}'`);

    opts.console = this;
    monitor = create(opts);
    if (this.monitors[name]) this.monitors[name].terminate();

    for (key in this.monitors) {
        monitors[key] = key === name ? monitor : this.monitors[key];
    }

    Object.freeze(monitors);
    Object.defineProperty(this, "monitors", {
        configurable: true,
        value: monitors
    });

    monitor.on("cleared", () => {
        this.log("cleared:", name);
    });

    monitor.on("failure", () => {
        this.log("failure:", name);
    });

    monitor.on("alert", () => {
        this.log("alert:", name);
    });
};

/**
 * Write to application log.
 * @param {...string} args
 */
BodewellApp.prototype.log = function(args) {
    console.log.apply(console, arguments);
};

/**
 * Write to application error log.
 * @param {...string} args
 */
BodewellApp.prototype.error = function(args) {
    console.error.apply(console, arguments);
};

/**
 * Write to application debug log.
 * @param {...string} args
 */
BodewellApp.prototype.debug = function(args) {
    if (process.env.debug) {
        console.log.apply(console, arguments);
    }
};

module.exports = BodewellApp;
