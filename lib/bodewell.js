/**
 * Create bodewell middleware.
 * @param {Server} server
 */
function bodewell(server) {
    return function(req, res, next) {
        res.write("ok");
        res.end();
    };
}

module.exports = bodewell;
