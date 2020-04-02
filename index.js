const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const port = process.env.PORT || 4001;
const bodyParser = require('body-parser');
const User = require('./shared/models/User');
const app = express();
// Imports the Dialogflow library
const dialogflow = require('dialogflow');

//uuid for session
const uuid = require('uuid');
//require Dialogue flow SDK
// const apiai = require('apiai');
//setup config parameters
// const flowConfig = require('./shared/config/dialogFlow.json');
// const DF = apiai(flowConfig.API_KEY); //TODO move config to use ENV_VARS


//load modules for data persistence
const cache = require('./shared/lib/cache').getRedisClient();
const db = require('./shared/lib/db');
const _ = require('underscore');
const PR = require('./processor/processor');


// Connect to our mongo database
//db.connect();

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

const projectID = 'nlng-bot-andy-smcowk';
const languageCode = 'en-US';
const sessionID = uuid.v4();
let context = '';


// Instantiates a session client
const sessionClient = new dialogflow.SessionsClient();

async function detectIntent(
    projectId,
    sessionId,
    query,
    contexts,
    languageCode
) {
    // The path to identify the agent that owns the created intent.
    const sessionPath = sessionClient.sessionPath(projectId, sessionId);

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: query,
                languageCode: languageCode,
            },
        },
    };

    if (contexts && contexts.length > 0) {
        request.queryParams = {
            contexts: contexts,
        };
    }

    const responses = await sessionClient.detectIntent(request);
    return responses[0];
}

io.on("connection", socket => {
    console.log("New client connected");
    socket.on("disconnect", () => console.log("Client disconnected"));
    socket.on("clientRequest", async data => {

        try{

            console.log(`Sending Query: ${data}`);
            intentResponse = await detectIntent(
                projectID,
                sessionID,
                data,
                context,
                languageCode
            );
            console.log('Detected intent');
            console.log(
                `Fulfillment Text: ${intentResponse.queryResult.fulfillmentText}`
            );
            // Use the context from this response for next queries
            context = intentResponse.queryResult.outputContexts;

            PR(intentResponse, function(err, intentResponse){
                console.log(data)
                if(data){
                    socket.emit("message", intentResponse);
                }

            });
        } catch(e) {
            console.log(e);
        }

    });
});




server.listen(port, () => console.log(`Listening on port ${port}`));


