const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const port = process.env.PORT || 4001;
const bodyParser = require('body-parser');
const User = require('./shared/models/User');
const app = express();
//require Dialogue flow SDK
const apiai = require('apiai');
//setup config parameters
const flowConfig = require('./shared/config/dialogFlow.json');
const DF = apiai(flowConfig.API_KEY); //TODO move config to use ENV_VARS


//load modules for data persistence
const cache = require('./shared/lib/cache').getRedisClient();
const db = require('./shared/lib/db');
const _ = require('underscore');
const PR = require('./processor/processor');


// Connect to our mongo database
db.connect();

//load module for loggin
const logger = require('./shared/lib/log');



//passing body params for post
app.use(bodyParser.urlencoded({extended: false}));

// parse application/json
app.use(bodyParser.json())

const index = require("./routes/index");
app.use(index);
const server = http.createServer(app);
const io = socketIo(server);
io.on("connection", socket => {
    console.log("New client connected");
    socket.on("disconnect", () => console.log("Client disconnected"));
    socket.on("clientRequest", data => {
        const request = DF.textRequest(data, {sessionId: '7u099ujhgythbn'});
        request.on('response', function(response) {
            // do all computations here for now.
            PR(response, function(err, data){
                console.log(data)
                if(data){
                    socket.emit("message", data);
                }

            });
        });

        request.on('error', function(error) {
            console.log(error);
        });

        request.end();
    });
});




server.listen(port, () => console.log(`Listening on port ${port}`));


