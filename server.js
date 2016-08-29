var figger = require("figger"),
    expand = require("expand-hash"),
    loadcerts = require("./lib/load-certs"),
    bodewell = require("./"),
    monitorType = require("./lib/monitor/monitor-type");

monitorType("disk", require("./lib/monitor/disk"));
monitorType("load", require("./lib/monitor/load"));
monitorType("mem", require("./lib/monitor/mem"));

figger("/etc/bodewell/config").then(loadcerts).then(function(config) {
    var server,
        port, host;

    server = bodewell.createServer(new bodewell.Server(expand(config)));
    port = config.port || server.default_port;
    host = config.host || "127.0.0.1";

    server.listen(port, host, function() {
        var address = server.address();

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

