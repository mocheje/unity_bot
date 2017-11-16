// Retrieve handler for client->slackHandle and state
var getHandler = function(slackHandle, state, callback) {
  var db = require('../lib/db');
  var logger = require('./log');
  var Handler;

  // Get db model
  db.getModel('handlers', function(err, model) {
    if (err) {
      // Unable to retrieve clients db object
      logger.error('Fatal error: ' + err + '. Please resolve and restart the service');
      callback ('Unable to retrieve schema', err);
    } else {
      Handler = model;

      // Retrieve and return handler if found
      Handler.findOne({slackHandle: slackHandle, state: state}, function (err, h) {
        if (!err && h){
          callback('', h.handler);
        } else {
          if (err) {
            callback('Error retrieving handler', err);
            logger.error('Unable to retrieve handler:' + err);
          } else {
            callback('No ' + state + ' handler registered for ' + slackHandle);
            logger.info('No ' + state + ' handler registered for ' + slackHandle);
          }
        }
      });

    } 
  });

  
}


// Export the Collection constructor from this module.
module.exports.getHandler = getHandler;




