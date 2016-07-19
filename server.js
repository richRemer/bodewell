require("dotenv").config();

var bode = require("./"),
    server;

server = bode(process.env);

server.listen(process.env.port || server.port, function() {
    var address = server.address();
    
    address = address.family === "IPv6"
        ? `[${address.address}]:${address.port}`
        : `${address.address}:${address.port}`;
    
    console.log("listening on", address);
});
