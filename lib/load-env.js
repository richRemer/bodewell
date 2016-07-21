var fs = require("fs"),
    glob = require("glob"),
    dotenv = require("dotenv");

/**
 * Load environment configuration.  This function updates the global process
 * 'env' object.  This function should be called as early as possible.
 * @returns {Promise}
 */
function loadenv() {
    dotenv.config({path: "/etc/bode/config"});
    dotenv.config();

    return new Promise(function(resolve, reject) {
        if (!process.env.include) {
            resolve(process.env);
            return;
        }

        glob(process.env.include, function(err, files) {
            if (err) return reject(err);

            files.forEach(function(file) {
                dotenv.config({path: file});
            });

            resolve(process.env);
        });
    });
}

module.exports = loadenv;
