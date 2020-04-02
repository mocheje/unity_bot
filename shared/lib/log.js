var fs = require('fs');
var path = require('path');
var winston = require("winston");
var config = require("../config/log.json");
winston.emitErrs = true;

var logfile = (config.logenv === 'production' ? config.logfile : path.join(__dirname, '..', 'tmp', 'andy.log'));

// create log file if not existing
fs.closeSync(fs.openSync(logfile, 'a'));
    
var logger = new (winston.Logger)({
    transports: [
      new winston.transports.Console({
      	level: 'debug',
        handleExceptions: false,
        json: false,
        colorize: false,
        timestamp: function() {
          return new Date();
        },
        formatter: function(options) {
          // Return string will be passed to logger.
          return '[' + options.timestamp().toString() + '] '+ options.level.toUpperCase() +' '+ (undefined !== options.message ? options.message : '') +
            (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
        }
      }),
      new winston.transports.File({ 
      	level: 'debug',
        filename: logfile,
        handleExceptions: true,
        json: false,
        maxsize: 5242880, //5MB
        maxFiles: 5,
        timestamp: function() {
          return new Date();
        },
        formatter: function(options) {
          // Return string will be passed to logger.
          return '[' + options.timestamp().toString() + '] '+ options.level.toUpperCase() +' '+ (undefined !== options.message ? options.message : '') +
            (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
        },
        colorize: false
      })
    ],
    exceptionHandlers: [
      new winston.transports.Console({
        handleExceptions: true,
        json: true,
        colorize: false,
        timestamp: function() {
          return new Date();
        },
        formatter: function(options) {
        // Return string will be passed to logger.
        return '[' + options.timestamp().toString() + '] '+ options.level.toUpperCase() +' '+ (undefined !== options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
        }
      }),
      new winston.transports.File({ 
        filename: logfile,
        handleExceptions: true,
        json: true,
        formatter: function(options) {
          // Return string will be passed to logger.
          return '[' + options.timestamp().toString() + '] '+ options.level.toUpperCase() +' '+ (undefined !== options.message ? options.message : '') +
            (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
        }, 
        timestamp: function() {
          return new Date();
        }
        
      })
    ],
    exitOnError: false
});


/*
var Log = require('log')
  , fs = require('fs')
  , stream = fs.createWriteStream(config.logFile, { flags: 'a' })
  , logger = new Log('debug', stream);*/

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};