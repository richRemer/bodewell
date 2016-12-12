const BodewellService = require("bodewell-service");

function bodewell(opts) {
    return new BodewellService(opts);
}

module.exports = bodewell;
module.exports.BodewellService = BodewellService;
