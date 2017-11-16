var config = require("../config/rabbit.json")
var context = exports.context = new require('rabbit.js').createContext(config.host);
var CONTROLLER_INBOUND = exports.CONTROLLER_INBOUND = "controller.inbound";
