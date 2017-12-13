const express = require("express");
const router = express.Router();
const User = require('../shared/models/User');
const { VERIFY_TOKEN , PAGE_ACCESS_TOKEN } = require('../shared/config/facebook.json');
const apiai = require('apiai');
const flowConfig = require('../shared/config/dialogFlow.json');
const DF = apiai(flowConfig.API_KEY);
const PR = require('../processor/processor');
const request = require('request');
const FBMBOT = process.env.FBMBOT;

router.get("/", (req, res) => {
    res.send({ response: "I am alive" }).status(200);
});

//set route for oauth
router.post('/auth/confirmation', (req, res) => {
    console.log(req.body)
    res.send({response: "Thankyou"});

});

//set route for reqistering users
router.post('/register/user', (req, res) => {
    console.log(typeof(req.body.accounts))
    const user = req.body;
    //create user into the db
    if(user){
        User.create(user, function(err, data){
            if(err){
                console.log(err)
                res.send({response: "Error Saving user to the db", status: 500});
            } else {
                res.send({response: data, status: 200});
            }
        });
    } else {
        res.send({response: 'Empty payload received for user object', status: 200})
    }
});

// Accepts POST requests at /webhook endpoint
router.post('/webhook', (req, res) => {

    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Get the webhook event. entry.messaging is an array, but
            // will only ever contain one event, so we get index 0
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                console.log('received webhook event as message');
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

        });

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

// Accepts GET requests at the /webhook endpoint
router.get('/webhook', (req, res) => {

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {

        // Check the mode and token sent are correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Respond with 200 OK and challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

function handleMessage(sender_psid, received_message) {

    // Check if the message contains text
    if (received_message.text) {
        console.log('in handle request about sending DF request');
        const request = DF.textRequest(received_message.text, {sessionId: sender_psid});  //use sender psid as session
        request.on('response', function(response) {
            console.log(response);
            PR(response, function(err, data){
                if(data){
                    // Create the payload for a basic text message
                    const res = {
                        "text": data.result.fulfillment.speech
                    };
                    // Sends the response message
                    callSendAPI(sender_psid, res);
                }

            });
        });
        request.on('error', function(error) {
            console.log(error);
        });

        request.end();

    }


}

function callSendAPI(sender_psid, response) {
    console.log(FBMBOT);
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }
    // Send the HTTP request to the Messenger Platform
    const bot = FBMBOT || PAGE_ACCESS_TOKEN
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": bot },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

function handlePostback(sender_psid, received_postback) {
    let response;

    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
        response = { "text": "Thanks!" }
    } else if (payload === 'no') {
        response = { "text": "Oops, try sending another image." }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

module.exports = router;