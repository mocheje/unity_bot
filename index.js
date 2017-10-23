const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const port = process.env.PORT || 4001;
const index = require("./routes/index");
const app = express();
//require Dialogue flow SDK
const apiai = require('apiai');
//setup config parameters
const config = require('./config.json');
const DF = apiai(config.API_KEY); //TODO move config to use ENV_VARS

app.use(index);
const server = http.createServer(app);
const io = socketIo(server);
io.on("connection", socket => {
    console.log("New client connected");
    socket.on("disconnect", () => console.log("Client disconnected"));
    socket.on("clientRequest", data => {
        console.log("request received from client", data);
        const request = DF.textRequest(data, {sessionId: '1234567'});
        request.on('response', function(response) {
            console.log(response);
            socket.emit("message", response);
        });

        request.on('error', function(error) {
            console.log(error);
        });

        request.end();
    });
});

server.listen(port, () => console.log(`Listening on port ${port}`));