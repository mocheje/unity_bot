exports.getRedisClient = function(){
    // Retrieve a when-based promisefactory for redis
    var promiseFactory = require("when").promise,
    	redis = require("promise-redis")(promiseFactory),
		redisConfig = require("../config/redis.json");
	
    return redis.createClient(redisConfig.port, redisConfig.host, {});
}
