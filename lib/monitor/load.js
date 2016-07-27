var os = require("os"),
    createMonitor = require("./monitor");

/**
 * Create load average monitor.
 * @param {object} opts
 * @param {number} opts.threshold
 * @param {Console} [opts.console]
 */
function load(opts) {
    var threshold,
        level = 0,
        monitor,
        worker;

    if (!opts.threshold) throw new TypeError("threshold required");
    threshold = parseFloat(opts.threshold);
    
    /**
     * Take a sample.
     */
    function sample() {
        monitor.debug("taking a load sample");

        var loadavg = os.loadavg(),
            delay;

        if (!loadavg.some(failed)) monitor.clear();
        else loadavg.filter(failed).map(sample => monitor.fail({load: sample}));

        delay = monitor.state === "failed" ? 3000 : 100;
        worker = setTimeout(sample, delay);
    }

    /**
     * Test sample against threshold.
     * @param {number} sample
     * @returns {boolean}
     */
    function failed(sample) {
        return sample > threshold;
    }

    /**
     * Cancel monitor.
     */
    function cancel() {
        worker && clearTimeout(worker);
        worker = null;
    }

    monitor = createMonitor(cancel, opts.console);
    worker = setTimeout(sample);

    return monitor;
}

module.exports = load;
