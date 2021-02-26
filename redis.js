const redis = require('redis');
const bluebird = require('bluebird');

// redis
const REDISHOST = process.env.REDISHOST;
const REDISPORT = process.env.REDISPORT;

const redisClient = redis.createClient(REDISPORT, REDISHOST);
/* istanbul ignore next */
redisClient.on('error', (err) => console.error('REDIS ERROR: ', err));

// enable async get for redis
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

// flush redis variables for tests
const flushRedis = () => {
    redisClient.flushall();
};

exports.redisClient = redisClient;
exports.flushRedis = flushRedis;
