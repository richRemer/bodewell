const Service = require("bodewell-service");

function bodewell(opts) {
    return new Service(opts);
}

module.exports = bodewell;
module.exports.BodewellService = BodewellService;
