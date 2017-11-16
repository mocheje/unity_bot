//using smslive 247
const { username, password, email } = require('../config/smslive.json')
console.log(username);
const sender = 'Michael'
const axios = require('axios')


exports.sendSms = function(message, sendTo){
    const url = `http://www.smslive247.com/http/index.aspx?cmd=sendquickmsg&owneremail=${email}&subacct=${username}&subacctpwd=${password}&message=${message}&sender=${sender}&sendto=${sendTo}&msgtype=0`
    // Make a request for a user with a given ID
    axios.get(url)
        .then(function (response) {
            console.log(`Sent sms to ${sendTo} ${response.status}`);
        })
        .catch(function (error) {
            console.log(error);
        });

}