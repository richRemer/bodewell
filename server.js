var bode = require("./"),
    server;

server = bode({});

server.listen(process.env.port || server.port, function() {
    var address = server.address();
    
    address = address.family === "IPv6"
        ? `[${address.address}]:${address.port}`
        : `${address.address}:${address.port}`;
    
    console.log("listening on", address);
});
