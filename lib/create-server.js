var http = require("http"),
    https = require("https"),
    bodewell = require("./bodewell");

/**
 * Create monitor web server.
 * @param {bodewell.Server} server
 * @returns {http.Server|https.Server}
 */
function createServer(server) {
    var secure = Boolean(process.env.pfx || process.env.cert),
        web;

    web = secure
        ? https.createServer(process.env)
        : http.createServer();

    web.default_port = secure ? 443 : 80;
    web.on("request", bodewell(server));

    return web;
}

module.exports = createServer;
