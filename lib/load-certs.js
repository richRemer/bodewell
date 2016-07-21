var fs = require("fs");

/**
 * Load certificates from file system.
 * @param {object} opts
 * @param {string} [opts.cert]
 * @param {string} [opts.key]
 * @param {string} [opts.ca]
 * @param {string} [opts.pfx]
 * @returns {Promise}
 */
function loadcerts(opts) {
    var files = [];

    ["pfx", "cert", "key", "ca"].forEach(function(prop) {
        if (opts[prop]) {
            files.push(new Promise(function(resolve, reject) {
                fs.readFile(opts[prop], function(err, data) {
                    if (err) return reject(err);
                    opts[prop] = data;
                    resolve(prop);
                });
            }));
        }
    });
    
    return Promise.all(files).then(loaded => opts);
}

module.exports = loadcerts;
