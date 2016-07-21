var http = require("http"),
    https = require("https"),
    bode = require("./bode");

/**
 * Create monitor server.
 * @param {BodeApp} app
 * @returns {http.Server|https.Server}
 */
function createServer(app) {
    var secure = Boolean(process.env.pfx || process.env.cert),
        server;

    server = secure
        ? https.createServer(process.env)
        : http.createServer();

    server.default_port = secure ? 443 : 80;
    server.on("request", bode(app));

    return server;
}

module.exports = createServer;
