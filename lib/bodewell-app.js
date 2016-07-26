var os = require("os"),
    monitorType = require("./monitor/monitor-type");

/**
 * Bodewell application object.
 * @constructor
 * @param {object} [opts]
 * @param {object.<string,object>} [opts.monitor]
 * @param {string} [opts.alert]
 */
function BodewellApp(opts) {
    var monitors,
        report = opts.report ? opts.report.split(",") : [],
        name;

    opts = opts || {};
    monitors = opts.monitor || {};

    Object.defineProperty(this, "monitors", {configurable: true, value: {}});
    Object.defineProperty(this, "report", {configurable: true, value: report});
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

    monitor.on("cleared", (data) => {
        var text = opts.recover || "${name} recovered on ${host}",
            msg;

        data = data || {};
        data.host = os.hostname();
        data.name = name;
        msg = this.format(text, data);

        this.log("cleared:", name);
        this.notify(msg);
    });

    monitor.on("failure", () => {
        this.log("failure:", name);
    });

    monitor.on("alert", (data) => {
        var text = opts.text || "${name} triggered on ${host}",
            msg;

        data.host = os.hostname();
        data.name = name;
        msg = this.format(text, data);

        this.log("alert:", name);
        this.notify(msg);
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

/**
 * Send alert message.
 * @param {...string} args
 */
BodewellApp.prototype.notify = function(args) {
    console.error.apply(console, arguments);
};

/**
 * Format alert message.
 * @param {string} text
 * @param {object} data
 */
BodewellApp.prototype.format = function(text, data) {
    return text.replace(/\${(.*?)}/g, function(match, name) {
        return data[name] || "";
    });
};

module.exports = BodewellApp;
