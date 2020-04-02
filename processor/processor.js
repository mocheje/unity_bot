//import module for sending sms
const sendSms = require('../shared/lib/sms').sendSms

function processResponse(res, callback) {
    console.log(res.queryResult.intent.displayName)
    switch (res.queryResult.intent.displayName) {
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
                            res.queryResult.fulfillmentText = `This Phone number ${phone} is not associated with any account`
                            callback('', res)
                        }

                    })
            } else {
                res.queryResult.fulfillmentText = `This Phone number ${phone} is not associated with any account`
                callback('', res)
            }
            break;

        case 'check.account_balance.context - custom':
            const token = res.result.parameters.token;
            res.queryResult.fulfillmentText = `Token ${token} correct and your account balance is 60000.009 NGN`;
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
                                res.queryResult.fulfillmentText = `${amount} transferred to ${ben[0].fullname} and your current balance is ${60000.009 - amount}`
                            } else if(ben && ben.length == 1){
                                res.queryResult.fulfillmentText = `${amount} has been transferred to ${beneficiary} from ${account}`
                            } else {
                                res.queryResult.fulfillmentText = `Beneficiary not found Do you want to add ${beneficiary} as a beneficiary`
                            }
                            callback('', res);
                        } else {
                            res.queryResult.fulfillmentText = `Account number ${account} does not exist`;
                            callback('', res)
                        }
                    })
            } else {
                callback('', res)
            }
            break;
        case 'fund_transfer - add - beneficiary':
            res.queryResult.fulfillmentText = `Beneficiary Added`;
            callback('', res);
            break;
        case 'atm - locator - location':
            const { address } = res.result.parameters;
            res.queryResult.fulfillmentText = `There are atm machines 10 blocks away from ${address} `;
            callback('', res);
            break;
        default :
            res.queryResult.fulfillmentText = res.queryResult.fulfillmentText || `Processing... you can go ahead and ask other things while i'm running my queries`
            callback('', res)
    }
}

exports = module.exports = processResponse;