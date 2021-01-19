const axios  = require('axios');
const express = require('express');
const redis = require('redis');



const app = express();

const client = redis.createClient({
    port:6379
});

client.on('error',error => console.error(error));

app.get(`/recipe/:foodItem`, async (req,res,next) => {

    try {

        //destructure the foodItem from params.
        let {foodItem} = req.params;

        let hashKey = new Buffer.from(`${foodItem}`).toString('base64');


        //check the data on redis store.
        client.hget(hashKey,foodItem, async (err,recipe) => {

            if(recipe){

                //send the response from cache
                return res.send({
                    success:true,
                    message:JSON.parse(recipe),
                    meta_data:'from cache'
                });

            } else {

                //we have to fetch from the api.

                //fetch the data.
                const recipe = await axios.get(`http://www.recipepuppy.com/api/?q=${foodItem}`).catch(console.log);

                //set the data on cache
                client.hset(hashKey,foodItem,JSON.stringify(recipe.data.results))
                client.expire(hashKey,1440);
                

                //send the response
                return res.send({
                    success:true,
                    message:recipe.data.results,
                    meta_data:'from server'
                })


            }

        });

    }catch(err){

        return res.send({
            success:false,
            message:err
        });

    };    

});


const PORT = process.env.PORT || 3000;


app.listen(PORT,() => {
    console.log(`listening on ${PORT}`)
});