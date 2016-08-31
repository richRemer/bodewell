var figger = require("figger"),
    expand = require("expand-hash"),
    loadcerts = require("./lib/load-certs"),
    bodewell = require("./"),
    server = new bodewell.Server(),
    monitorType = require("./lib/monitor/monitor-type");

monitorType("disk", require("./lib/monitor/disk"));
monitorType("load", require("./lib/monitor/load"));
monitorType("mem", require("./lib/monitor/mem"));

function loadConfig() {
    var config = process.env.config || "/etc/bodewell/config";
    return figger(config).then(loadcerts).then(expand);
}

Promise.all([loadConfig(), server.discoverPlugins()]).then(results => {
    var config = results[0],
        webServer,
        port, host;

    server.configure(config);
    webServer = bodewell.createServer(server);

    port = config.port || webServer.default_port;
    host = config.host || "127.0.0.1";

    webServer.listen(port, host, function() {
        var address = webServer.address();

        if (process.env.user) {
            console.log("dropping privileges");
            process.setgid(process.env.group || process.env.user);
            process.setuid(process.env.user);
        }

        address = address.family === "IPv6"
            ? `[${address.address}]:${address.port}`
            : `${address.address}:${address.port}`;

        console.log("listening on", address);
    });
}).catch(function(err) {
    console.error(process.env.debug ? err.stack : err.message);
});

