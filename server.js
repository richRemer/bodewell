var expand = require("expand-hash"),
    loadenv = require("./lib/load-env"),
    loadcerts = require("./lib/load-certs"),
    bode = require("./");

loadenv().then(loadenv).then(loadcerts).then(function(config) {
    var server,
        port, host;

    server = bode.createServer(new bode.BodeApp(config));
    port = process.env.port || server.default_port;
    host = process.env.host || "127.0.0.1";

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

