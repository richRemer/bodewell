var types = {};

/**
 * Register or lookup monitor types.
 * @param {string} name
 * @param {function} [MonitorType]
 */
function type(name, MonitorType) {
    if (MonitorType) {
        if (name in types && types[name] !== MonitorType) {
            throw new Error("cannot redefine monitor type");
        }
        types[name] = MonitorType;
    } else {
        return types[name];
    }
}

module.exports = type;
