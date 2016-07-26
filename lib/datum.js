/**
 * Value with accompanying timestamp.
 * @param {number} value
 * @param {Date} [timestamp]
 * @returns {Datum}
 */
function datum(value, timestamp) {
    var datum = {};
    
    if (!timestamp || !(timestamp instanceof Date)) {
        timestamp = new Date();
    }
    
    /**
     * @name Datum#value
     * @type {number}
     * @readonly
     */
    datum.value = Number(value);
    
    /**
     * @name Datum#timestamp
     * @type {Date}
     * @readonly
     */
    datum.timestamp = timestamp;
    
    /**
     * @name Datum#valueOf
     * @function
     * @readonly
     * @returns {number}
     */
    datum.valueOf = function() {return this.value;}
    
    Object.freeze(datum);

    return datum;
}

module.exports = datum;
