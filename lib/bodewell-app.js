var os = require("os"),
    proc = require("child_process"),
    monitorType = require("./monitor/monitor-type");

/**
 * Bodewell application object.
 * @constructor
 * @param {object} [opts]
 * @param {object.<string,object>} [opts.monitor]
 * @param {string} [opts.report]
 */
function BodewellApp(opts) {
    Object.defineProperty(this, "monitors", {configurable: true, value: {}});
    Object.defineProperty(this, "report", {configurable: true, value: []});
    Object.freeze(this.monitors);
    Object.freeze(this.report);

    this.configure(opts);
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
    },

    /**
     * @name BodewellApp#report
     * @type {string[]}
     * @readonly
     */
    report: {
        configurable: true,
        enumerable: true,
        writable: false,
        value: null
    }
});

/**
 * Configure the application.
 * @param {object} opts
 * @param {object.<string,object>} [opts.monitor]
 * @param {string} [opts.report]
 */
BodewellApp.prototype.configure = function(opts) {
    opts = opts || {};

    if (opts.report) this.updateReports(opts.report.split(","));
    if (opts.monitor) this.updateMonitors(opts.monitor);
};

/**
 * Change who gets notifications.  Current reports will be removed if not
 * present in the list of email addresses.
 * @param {string[]} emails
 */
BodewellApp.prototype.updateReports = function(emails) {
    // remove existing reports
    this.report.filter(e => !~emails.indexOf(e)).map(this.quiet.bind(this));

    // add new reports
    emails.filter(e => !~this.report.indexOf(e)).map(this.email.bind(this));
};

/**
 * Send notifications to the provided email address.
 * @param {string} email
 */
BodewellApp.prototype.email = function(email) {
    var updated;

    if (!~this.report.indexOf(email)) {
        updated = Object.freeze(this.report.concat(email));
        Object.defineProperty(this, "report", updated);
        this.debug(`report:+${email}`);
    }
};

/**
 * Stop sending notifications to the provided email address.
 * @param {string} email
 */
BodewellApp.prototype.quiet = function(email) {
    var updated;

    if (~this.report.indexOf(email)) {
        updated = Object.freeze(this.report.filter(e => e !== email));
        Object.definedProperty(this, "report", updated);
        this.debug(`report:-${email}`);
    }
};

/**
 * Update monitors.  Active monitors not present in the provided monitors will
 * be removed.
 * @param {object.<string,object>} monitors
 */
BodewellApp.prototype.updateMonitors = function(monitors) {
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

    this.debug(`monitor:+${name}`);
};

/**
 * Take down a monitor.
 * @param {string} name
 */
BodewellApp.prototype.unmonitor = function(name) {
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
    var app = this,
        sendmail,
        subject, to, msg,
        email,
        sendlog = "";

    msg = Array.prototype.join.call(arguments, " ");
    subject = msg.split("\n")[0];
    to = this.report.join(",");
    email = `Subject:${subject}\nTo:${to}\n\n${msg}`;

    sendmail = proc.spawn("sendmail", [to]);
    sendmail.stdout.on("data", (data) => sendlog += String(data));

    sendmail.on("close", function(code) {
        if (code !== 0) {
            app.error("failed sending email");
            app.error(sendlog);
        } else {
            app.log("sent email to:", to);
        }
    });

    sendmail.on("error", function(err) {
        app.error(err);
    });

    sendmail.stdin.write(email);
    sendmail.stdin.end();
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
