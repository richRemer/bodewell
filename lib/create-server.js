var http = require("http"),
    https = require("https");

/**
 * Create monitor server.
 * @param {object} opts
 * @returns {http.Server|https.Server}
 */
function createServer(opts) {
    var secure = Boolean(opts.pfx || opts.cert),
        server;

    server = secure
        ? https.createServer(opts)
        : http.createServer();

    server.port = secure ? 443 : 80;

    return server;
}

module.exports = createServer;
