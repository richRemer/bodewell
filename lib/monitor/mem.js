var free = require("free-memory"),
    bytesized = require("bytesized"),
    createMonitor = require("./monitor");

/**
 * Create free memory monitor.
 * @param {object} opts
 * @param {string|number} opts.threshold
 * @param {number} [opts.headroom]
 * @param {Console} [opts.console]
 */
function mem(opts) {
    var threshold,
        headroom = 5,
        monitor,
        worker;

    if (!opts.threshold) throw new TypeError("threshold required");
    if (opts.headroom) headroom = parseInt(opts.headroom);
    threshold = bytesized(opts.threshold);

    /**
     * Take a sample.
     */
    function sample() {
        monitor.debug("taking a memory sample");

        free(function(err, info) {
            var delay;

            if (err) {
                monitor.emit("error", err);
            } else if (failed(info.mem)) {
                monitor.fail(info.mem);
            } else if (cleared(info.mem)) {
                monitor.clear();
            }

            delay = monitor.state === "failed" ? 15000 : 1500;
            worker = setTimeout(sample, delay);
        });
    }

    /**
     * Test sample against threshold.
     * @param {object} sample
     * @returns {boolean}
     */
    function failed(sample) {
        // NOTE: use .cached value; seems like free-memory module reports
        // .free+.buffers+.cached simply as .cached; .usable is junk
        return threshold < 1
            ? sample.cached/sample.total < threshold
            : sample.cached < threshold;
    }

    /**
     * Test sample against clear threshold.
     * @param {object} sample
     * @returns {boolean}
     */
    function cleared(sample) {
        var factor = 1 + headroom / 100;

        return threshold < 1
            ? sample.cached/sample.total * factor > threshold
            : sample.cached * factor > threshold;
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

module.exports = mem;
