const axios = require('axios');

const redis = require('redis');

const client=  redis.createClient({
    port:6379
});

client.on('error', (error) => {
    console.error(error);
});

module.exports = (req,res,next) => {

    //Implementation shall go here.
    
};