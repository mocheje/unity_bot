var mongoose = require('mongoose');

// Create a new schema for our data
var schema = new mongoose.Schema({
    first_name      : String
    , last_name       : String
    , full_name       : String
    , email           : String
    , phone           : String
    , avatar          : String
    , timezone        : String
    , timezone_offset : Number
    , active          : Boolean
    , createdAt       : { type: Date, default: Date.now }
    , preferences     : [{
        pKey   : String
        , pValue : String
    }],
        account         : {
            number: String
            , type: { type: String, default: 'Master'}
            , currency: String
        }
    , beneficiaries      : [{
        fullname        : String
        , bank          : String
        , nuban         : Number
        ,
    }],
    cards         : [{
        number: Number
        , type: { type: String, default: 'Master'}
        , status: String
    }],
    transactions    : [{
    reference       : String
    , sender        : String
    , receiver      : String
    , amount        : Number
}]
});




// Static methods
schema.statics.getUserByAccountNumber = function(account, callback) {
    var promise = new mongoose.Promise;
    if(callback) promise.addBack(callback);

    User.findOne({ 'accounts.nuban' : account }).exec( function(err, doc) {
        if (err) {
            promise.error(err);
            return;
        }
        promise.complete(doc);
    });

    return promise;

};


schema.statics.getUserByID = function(userId, callback) {
    var promise = new mongoose.Promise;
    if(callback) promise.addBack(callback);

    User.findOne({ '_id' : userId }).exec( function(err, doc) {
        if (err) {
            promise.error(err);
            return;
        }
        promise.complete(doc);
    });

    return promise;

};

schema.statics.getUserByEmail = function(email, callback) {
    var promise = new mongoose.Promise;
    if(callback) promise.addBack(callback);

    User.findOne({ 'email' : email }).exec( function(err, doc) {
        if (err) {
            promise.error(err);
            return;
        }
        promise.complete(doc);
    });

    return promise;

};


schema.statics.getUserPreference = function(email, prefKey, callback) {
    var promise = new mongoose.Promise;
    if(callback) promise.addBack(callback);

    User.findOne({ 'email' : email, 'preferences.pKey' : prefKey }).exec( function(err, doc) {
        if (err) {
            promise.error(err);
            return;
        }
        if (doc) {
            var prefs = doc.preferences;
            var thePref;
            prefs.forEach(function(pref) {
                if (pref.pKey === prefKey) {
                    thePref = pref;
                }
            });
            promise.complete(thePref);
        } else {
            promise.complete(doc);
        }
    });

    return promise;

};
//TODO add other methods for determining account balance

// Return a User model based upon the defined schema
module.exports = User = mongoose.model('users', schema);


