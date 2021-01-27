const axios = require('axios');

const redis = require('redis');

const client=  redis.createClient({
    port:6379
});

client.on('error', (error) => {
    console.error(error);
});

const fetchFoodItem = async (req,res,next) => {

    try {

        //get the food item.

        let { foodItem } = req.params;

        //hash the key.

        let hashKey = new Buffer.from(`${foodItem}}`).toString("base64");        
    
        //check the data on redis store.

        client.hget(hashKey,foodItem, async (_, recipe) => {

          if (recipe) {

            //send the response from cache

            return res.send({
              success: true,
              message: JSON.parse(recipe),
              meta_data: "from cache",
            });

          } else {
    
            //fetch the data.

            const recipe = await axios
            .get(`http://www.recipepuppy.com/api/?q=${foodItem}`)
            .catch(console.log);
    
            //set the data on cache

            client.hset(hashKey, foodItem, JSON.stringify(recipe.data.results));

            //set the duration of cache.

            client.expire(hashKey,1440);
    
            //send the response

            return res.send({
              success: true,
              message: recipe.data.results,
              meta_data: "from server",
            });

          };

        });
      } catch (err) {

        return res.send({
          success: false,
          message: err,
        });

      }
    
};

module.exports = {
    fetchFoodItem
};