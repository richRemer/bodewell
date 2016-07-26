var drivelist = require("nodejs-disks").drives,
    diskusage = require("nodejs-disks").driveDetail,
    bytesized = require("bytesized"),
    createMonitor = require("./monitor");

/**
 * Create a disk usage monitor.
 * @param {object} opts
 * @param {string|number} opts.threshold
 * @param {string} [opts.dev]
 * @param {number} [opts.interval]
 * @param {Console} [opts.console]
 */
function disk(opts) {
    var interval = 60 * 1000,   // 1 minute
        threshold,
        monitor,
        worker;

    if (!opts.threshold) throw new TypeError("threshold required");
    if (opts.interval) interval = 1000 * opts.interval;
    threshold = bytesized(opts.threshold);

    /**
     * Enumerate drives.
     * @returns {Promise}
     */
    function drives() {
        return new Promise(function(resolve, reject) {
            drivelist(function(err, disks) {
                if (err) reject(err);
                else resolve(disks.filter(disk => disk[0] === "/"));
            });
        });
    }
    
    /**
     * Enumerate disks which need to be checked.
     * @returns {Promise}
     */
    function disks() {
        return opts.dev
            ? Promise.resolve([opts.dev])
            : drives();
    }

    /**
     * Check disk space.
     * @param {string} dev
     * @returns {Promise}
     */
    function space(dev) {
        return new Promise(function(resolve, reject) {
            diskusage(dev, function(err, usage) {
                if (err) reject(err);
                else resolve(usage);
            });
        });
    }
    
    /**
     * Take a sample.
     */
    function sample() {
        monitor.debug("taking a disk sample from", opts.dev || "all devices");

        disks().then(function(disks) {
            disks = disks.map(space);
            return Promise.all(disks).then(function(disks) {
                return disks;
            });
        }).then(function(samples) {
            if (!samples.some(failed)) monitor.clear();
            else samples.filter(failed).map(sample => monitor.fail(sample));
        }).catch(function(err) {
            monitor.emit("error", err);
        }).then(function() {
            worker = setTimeout(sample, interval);
        });
    }

    /**
     * Test sample against threshold.
     * @param {object} sample
     * @returns {boolean}
     */
    function failed(sample) {
        var available = bytesized(sample.available.replace(/B$/, "iB")),
            total = bytesized(sample.total.replace(/B$/, "iB"));

        return threshold < 1
            ? available/total < threshold
            : available < threshold;
    }

    /**
     * Cancel monitor.
     */
    function cancel() {
        worker && clearTimeout(worker);
        worker = null;
    }

    monitor = createMonitor(cancel, opts.console);
    worker = setTimeout(sample, 0);

    return monitor;
}

module.exports = disk;
