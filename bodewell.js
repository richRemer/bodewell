const Service = require("bodewell-service");
const Resource = require("bodewell-resource");
const Monitor = require("bodewell-monitor");

function bodewell(opts) {
    return new Service(opts);
}

module.exports = bodewell;
module.exports.Service = Service;
module.exports.Resource = Resource;
module.exports.Monitor = Minitor;
