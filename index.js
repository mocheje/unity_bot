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

//import module for sending sms
const sendSms = require('./shared/lib/sms').sendSms
//load modules for data persistence
const cache = require('./shared/lib/cache').getRedisClient();
const db = require('./shared/lib/db');
const _ = require('underscore');


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
        const request = DF.textRequest(data, {sessionId: '7u097678u'});
        request.on('response', function(response) {
            // do all computations here for now.
            processResponse(response, function(err, data){
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


function processResponse(res, callback) {
    console.log(res.result.metadata.intentName)
    switch (res.result.metadata.intentName) {
        case 'check.account_balance.context':
            const phone = res.result.parameters['phone-number'];
            console.log(phone);
            if(phone){
                User.findOne({'phone': String(phone)})
                    .then(x => {
                        if(x){
                            sendSms(`your token is ${Math.ceil(Math.random()*100000)}`, phone);
                            callback('', res)
                        } else {
                            res.result.fulfillment.speech = `This Phone number ${phone} is not associated with any account`
                            callback('', res)
                        }

                    })
            } else {
               res.result.fulfillment.speech = `This Phone number ${phone} is not associated with any account`
               callback('', res)
            }
            break;

        case 'check.account_balance.context - custom':
            const token = res.result.parameters.token;
            res.result.fulfillment.speech = `Token ${token} correct and your account balance is 60000.009 NGN`;
            callback('', res)
            break;
        case 'fund_transfer':
            const { account, amount, beneficiary } = res.result.parameters;
            console.log(account, amount, beneficiary);
            if(account && amount && beneficiary){
                User.findOne({'account.number': String(account)})
                    .then(x => {
                        if(x){
                            //check if user has the beneficiary
                            const name = new RegExp(beneficiary);
                            const ben = x.beneficiaries.filter(f => (f.fullname.match(name)) !== null);
                            if(ben && ben.length == 1){
                                //transfer money to this beneficiary
                                res.result.fulfillment.speech = `${amount} transferred to ${ben[0].fullname} and your current balance is ${60000.009 - amount}`
                            } else if(ben && ben.length == 1){
                                res.result.fulfillment.speech = `${amount} has been transferred to ${beneficiary} from ${account}`
                            } else {
                                res.result.fulfillment.speech = `Beneficiary not found Do you want to add ${beneficiary} as a beneficiary`
                            }
                            callback('', res);
                        } else {
                            res.result.fulfillment.speech = `Account number ${account} does not exist`;
                            callback('', res)
                        }
                    })
            } else {
                callback('', res)
            }
            break;
        case 'fund_transfer - add - beneficiary':
            res.result.fulfillment.speech = `Beneficiary Added`;
            callback('', res);
            break;
        default :
            res.result.fulfillment.speech = res.result.fulfillment.speech || `Processing... you can go ahead and ask other things while i'm running my queries`
            callback('', res)
    }
}