var Event = require('../models/Event');
var logger = require('./log');
var moment = require('moment');
var mq = require('./mq');
var when = require('when');
var cache = require('./cache').getRedisClient();

var CACHE_PREFIX = 'scheduler:';
var pub = mq.context.socket('PUB', {routing: 'topic'});

var add = exports.add = function(eventTime, body, routingKey, owner) {
	var schedTime = new Date(eventTime);
	if (schedTime) {
		return Event.createEvent(schedTime, JSON.stringify(body), routingKey, owner
			).then(function(doc) {
				logger.info('Event %s for %s with routing %s scheduled for %s', doc._id, owner, routingKey, schedTime.toUTCString());
				logger.debug('Event body: %s', JSON.stringify(body));
				return doc._id;
			});
	} else {
		logger.warn('Cannot schedule event...invalid scheduleTime: %s', eventTime);
		return when(false);
	}
};



var run = exports.run = function() {
	var now = new Date();
	Event.getDueEvents(now).then(function(events) {
		if (events.length > 0) {
			events.forEach(function(event) {
				// set msgid
				try {
					var jBody = JSON.parse(event.body);
					jBody.id = new Date().getTime();
					jBody.body.schEventId = event._id;
				} catch (e) {
					jBody = event.body;
				}
				
				logger.info('SCHEDULER: Connecting to MQ Exchange <piper.events.scheduler>...');
				pub.connect('piper.events.scheduler', function() {
					logger.info('SCHEDULER: <piper.events.scheduler> connected');
					pub.publish(event.routingKey, JSON.stringify(jBody)); // publish body to mq
				});
			});
			Event.removeDueEvents(now); //delete processed items
		}
	});
	
};
