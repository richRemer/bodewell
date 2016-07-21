var fs = require("fs"),
    glob = require("glob"),
    dotenv = require("dotenv");

/**
 * Load environment configuration.  This function updates the global process
 * 'env' object.  This function should be called as early as possible.
 * @returns {Promise}
 */
function loadenv() {
    dotenv.config({silent: true, path: "/etc/bodewell/config"});
    dotenv.config({silent: true});

    return new Promise(function(resolve, reject) {
        if (!process.env.include) {
            resolve(process.env);
            return;
        }

        glob(process.env.include, function(err, files) {
            if (err) return reject(err);

            files.forEach(function(file) {
                dotenv.config({silent: true, path: file});
            });

            resolve(process.env);
        });
    });
}

module.exports = loadenv;
