/**
 * Create bode middleware.
 * @param {BodeApp} app
 */
function bode(app) {
    return function(req, res, next) {
        res.write("ok");
        res.end();
    };
}

module.exports = bode;
