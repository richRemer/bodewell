var os = require("os"),
    proc = require("child_process"),
    npmls = require("npmls"),
    monitorType = require("./monitor/monitor-type"),
    Contact = require("./contact"),
    Message = require("./message"),
    Dispatcher = require("./dispatcher");

/**
 * Bodewell application object.
 * @constructor
 * @param {object} [opts]
 * @param {object.<string,object>} [opts.monitor]
 * @param {string} [opts.report]
 */
function Server(opts) {
    Object.defineProperty(this, "monitors", {configurable: true, value: {}});
    Object.freeze(this.monitors);

    this.report = new Set();
    this.dispatchers = new Set();

    this.configure(opts);
}

Object.defineProperties(Server.prototype, {
    /**
     * @name Server#monitors
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
 * @name Server#dispatchers
 * @type {Set<Dispatcher>}
 * @readonly
 */
Server.prototype.dispatchers = null;

/**
 * @name Server#report
 * @type {Set<Contact>}
 * @readonly
 */
Server.prototype.report = null;

/**
 * Auto-discover and enable plugins beginning with 'bodewell-plugin-'.
 * @returns {Promise}
 */
Server.prototype.discoverPlugins = function() {
    var valid = /^bodewell-plugin-./;

    return new Promise((resolve, reject) => {
        npmls((err, modules) => {
            if (err) return reject(err);

            modules.filter(module => valid.test(module))
                .map(module => this.plugin(require(module)))
                .reduce((a, b) => a.then(() => b), Promise.resolve())
                .then(resolve)
                .catch(reject);
        });
    });
}

/**
 * Enable plugin.
 * @param {function} plugin
 * @returns {Promise}
 */
Server.prototype.plugin = function(plugin) {
    return Promise.resolve(plugin(this)).then(() => true);
};

/**
 * Configure the application.
 * @param {object} opts
 * @param {object.<string,object>} [opts.monitor]
 * @param {string} [opts.report]
 */
Server.prototype.configure = function(opts) {
    opts = opts || {};

    if (opts.report) this.reports(Contact.select(opts.report.split(",")));
    if (opts.monitor) this.updateMonitors(opts.monitor);

    Object.keys(opts.contact || {}).map(id => Contact(id, opts.contact[id]));
};

/**
 * Define or return a dispatcher.
 * @param {string} id
 * @param {function} [dispatcher]
 * @param {function)
 */
Server.prototype.dispatcher = function(id, dispatcher) {
    if (arguments.length === 1) {
        for (dispatcher of this.dispatchers.entries()) {
            if (dispatcher.id === id) return dispatcher;
        }

        return undefined;
    } else {
        this.dispatchers.add(Dispatcher(id, dispatcher));
    }
};

/**
 * Change who gets notifications.  Current reports will be removed if not
 * present in the set.
 * @param {Set<Contact>} contacts
 */
Server.prototype.reports = function(contacts) {
    this.report = contacts;
};

/**
 * Update monitors.  Active monitors not present in the provided monitors will
 * be removed.
 * @param {object.<string,object>} monitors
 */
Server.prototype.updateMonitors = function(monitors) {
    var keys = Object.keys(this.monitors);

    // remove existing monitors
    keys.filter(k => !(k in monitors)).map(this.unmonitor.bind(this));

    // additions and updates to existing monitors
    Object.keys(monitors).map(key => this.monitor(key, monitors[key]));
};

/**
 * Configure a monitor.
 * @param {string} name
 * @param {object} opts
 * @param {string} opts.type
 */
Server.prototype.monitor = function(name, opts) {
    var type = opts.type,
        monitors = {},
        monitor, key,
        create;

    if (!type) throw new TypeError("missing monitor type");

    create = monitorType(type);
    if (!create) throw new Error(`unrecognized monitor type '${type}'`);

    opts.console = this;
    monitor = create(opts);
    if (this.monitors[name]) {
        this.monitors[name].terminate();
        this.log("monitor", name, "disabled");
    }

    for (key in this.monitors) {
        monitors[key] = key === name ? monitor : this.monitors[key];
    }

    Object.freeze(monitors);
    Object.defineProperty(this, "monitors", {
        configurable: true,
        value: monitors
    });

    monitor.on("cleared", (data) => {
        var text = opts.recover || "${name} recovered on ${host}";

        data = data || {};
        data.host = os.hostname();
        data.name = name;

        this.log("cleared:", name);
        this.send(Message(this.format(text, data)));
    });

    monitor.on("failure", () => {
        this.log("failure:", name);
    });

    monitor.on("alert", (data) => {
        var text = opts.text || "${name} triggered on ${host}";

        data.host = os.hostname();
        data.name = name;

        this.log("alert:", name);
        this.send(Message(this.format(text, data)));
    });

    this.debug(`monitor:+${name}`);
};

/**
 * Take down a monitor.
 * @param {string} name
 */
Server.prototype.unmonitor = function(name) {
    var key, monitors;

    if (!(name in this.monitors)) return;

    for (key in this.monitors) {
        if (key !== name) monitors[key] = this.monitors[key];
        else {
            this.monitors[key].terminate();
            this.debug(`monitor:-${name}`);
        }
    }

    Object.freeze(monitors);
    Object.defineProperty(this, "monitors", {
        configurable: true,
        value: monitors
    });
};

/**
 * Write to application log.
 * @param {...string} args
 */
Server.prototype.log = function(args) {
    console.log.apply(console, arguments);
};

/**
 * Write to application error log.
 * @param {...string} args
 */
Server.prototype.error = function(args) {
    console.error.apply(console, arguments);
};

/**
 * Write to application debug log.
 * @param {...string} args
 */
Server.prototype.debug = function(args) {
    if (process.env.debug) {
        console.log.apply(console, arguments);
    }
};

/**
 * Send notification message.
 * @param {Message} message
 */
Server.prototype.send = function(message) {
    var todo = new Set(this.report);

    this.dispatchers.forEach(dispatcher => {
        Array.from(todo).filter(c => c.use === dispatcher.id)
            .map(contact => {
                dispatcher.dispatch(contact, message)
                todo.delete(contact);
                this.log("sent notification to", contact.id);
            });
    });

    if (todo.length) {
        this.error("failed to notify: " + Array.from(todo).join(","));
    }
};

/**
 * Format alert message.
 * @param {string} text
 * @param {object} data
 */
Server.prototype.format = function(text, data) {
    return text.replace(/\${(.*?)}/g, function(match, name) {
        return data[name] || "";
    });
};

module.exports = Server;
