/**
 * Create bodewell middleware.
 * @param {BodewellApp} app
 */
function bodewell(app) {
    return function(req, res, next) {
        res.write("ok");
        res.end();
    };
}

module.exports = bodewell;
