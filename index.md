Caching refers to the process of storing data in a temporary location so that the data is accessed with minimal resources. Caching aims to reduce the cost of bandwidth of data sent over the network, and the application's response time. Applications that implement caching are faster and user friendly.

#### prerequisites.

To follow along in this article, it is helpful to have the following:

- [Node.js](https://nodejs.org/en/) installed on your computer.
- Working knowledge of JavaScript.
- Working knowledge of Node.js and [Express.js](https://expressjs.com/).
- [Postman](https://www.postman.com/) installed on your computer.
- Linux or macOS based operating system.

### Application overview.

In this article, we will walk through the steps of implementing caching in a Node.js app using [redis](https://redis.io/). We will implement a REST API using the Express.js framework. We will be making requests to [recipe labs api](http://www.recipepuppy.com/?ref=hackernoon.com). It is a public API for accessing recipes of different food items.

#### Setting up the application.

Having installed [Node.js](https://nodejs.org/en/), we are equipped with [npm](https://www.npmjs.com/) which we will use to install the necessary dependencies. Proceed to the directory where you want the project to be and run the following command.

```bash
npm init --yes
```

With the `package.json` file generated, we can continue to the next step.

#### Installing dependencies.

We will need the following dependencies:

- **axios**: For handling requests to the public API.
- **express**: For setting up a working Express.js environment.
- **nodemon**: For automatically restarting the server whenever we make changes.
- **redis**: For implementing caching.

We install them using the following command:

```bash
npm install axios redis express nodemon
```

#### Configuring package.json

To incorporate `nodemon` in our development, we make the following adjustments in the `package.json` file:

```javascript
    {
        "scripts" : {
            //add the following
            "dev":"nodemon app.js",
            "start":"node app.js"
        }
    }
```

#### Creating Express.js app.

In the same directory, we create an `app.js` file. The file should be as below:

```javascript
//import express
const express = require("express");
//import axios
const axios = require("axios");
//import redis
const redis = require("redis");

//create an instance of an app.
const app = express();

//configure the port
const PORT = 3001;

//start the server
app.listen(PORT, () => {
  console.log(`app started on ${PORT}`);
});
```

#### Fetching data from the public API.

Since we have set up the application, we can now fetch the data from the public API. To do this, we need to implement a route. We shall fetch and return the data on the route.

The route shall be as follows:

```javascript
app.get(`/recipe/foodItem`, async (req, res, next) => {
  try {
    //destructure the foodItem from params.
    let { foodItem } = req.params;

    //fetch the data.
    const recipe = await axios
      .get(`http://www.recipepuppy.com/api/?q=${fooditem}`)
      .catch(console.log);

    //return a response.
    return res.send({
      success: true,
      message: recipe.data.results,
    });
  } catch (err) {
    return res.send({
      success: false,
      message: err,
    });
  }
});
```

From above:

- We implement a route on `/recipe/:foodItem`.
- `:foodItem` means that we are obtaining the food item dynamically.
- We fetch the data from the public API.
- Send the message to the client having destructed the necessary portion.

To test this, follow the following steps:

- Go back to your terminal and run `npm run dev` to start the development server.

- Head over to Postman and send a request to the route we have implemented above. Note that when sending the request, do not include the `:` colons. It is there to illustrate that the data to be sent is dynamic. A sample request is `http://localhost:3000/recipe/coffee`.

- Once the response is sent back, look at the time taken. Typically, it will take up to 600 ms or even more. This amount of time means that our application is consuming a lot of user network bandwidth. To handle this, we set up caching using `redis`.

#### Installing redis.

If you have already installed `redis` on your computer, feel free to proceed to the next step.

Proceed to your terminal and run the following command to take you to your home directory.

```bash
cd
```

Once in your home directory, run the following commands one by one:

```bash
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make
sudo make install
```

To confirm that `redis` has successfully been set up correctly, run the following command to start the `redis server`:

```bash
redis-server
```

Open a different tab and run:

```bash
redis-cli ping
```

If everything is okay, you should get back `PONG` as a response. Else if you get an error, kindly reference from the [official docs](https://redis.io/topics/quickstart).

#### Setting up redis.

Inside our `app.js` file, we incorporate `redis`.

```javascript
//connecting to our local redis instance
const client = redis.createClient({
  port: 6379, //default port of redis
});

//listen for any error
client.on("error", (error) => {
  console.error(error);
});

app.get(`recipe/:foodItem`, async (req, res, next) => {
  try {
    //destructure the foodItem from params.
    let { foodItem } = req.params;

    //check the data on redis store.
    client.get(foodItem, async (err, recipe) => {
      if (recipe) {
        //send the response from cache
        return res.send({
          success: true,
          message: JSON.parse(recipe),
          meta_data: "from cache",
        });
      } else {
        //we have to fetch from the api.

        //fetch the data.
        const recipe = await axios
          .get(`http://www.recipepuppy.com/api/?q=${foodItem}`)
          .catch(console.log);

        //set the data on cache
        client.set(foodItem, JSON.stringify(recipe.data.results));

        //send the response
        return res.send({
          success: true,
          message: recipe.data.results,
          meta_data: "from server",
        });
      }
    });
  } catch (err) {
    return res.send({
      success: false,
      message: err,
    });
  }
});
```

From above:

- We connect the `redis` package to the running `redis server` using the default port.

- Listen to any error that may come up.

- In our route, when we get the food item, we check whether we have such a record in the cache. If we have, we return it from there, else we request from the server, set it on the cache, and return the response.

- When storing data in the cache, we store it as a string hence while retrieving we have to `parse` it to get it in its original form.

To test the above:

- Ensure that the development server is up and running.

- Head over to Postman and send a request similar to: `http://localhost:3000/food/coffee`. You can replace coffee with any food you want.

- Wait for the response and observe the amount of time it has taken to get the response. In the process it has saved the data in the cache since it was not there.

- Send the same request again. This time the time taken to get the response will have significantly reduced. This is because the response was accessed from the cache. The network bandwidth used is also reduced.

#### Considerations while implementing caching.

While implementing caching, there are some considerations that one needs to make:

- **Shall the data be cached forever**: How often is the data being updated from its source? Normally, you would set the time for which the data should be cached. After that time has lapsed, any request sent will go straight to the source and set the data again.

Considering our implementation, we can set the data to be cached for only 24 minutes:

In the line where you are setting the data to cache, replace it with the following line of code.

```javascript
client.setex(foodItem, 1440, JSON.stringify(recipe.data.results));
```

- **Is the key for setting and getting data unique**: When the keys are similar, the cache will store inappropriate data. In order to curb this, you ensure the key is hashed before using it to set the data on the cache.

Considering our implementation, we can incorporate hashing by making the following changes:

```javascript
//set up a hash key

let hashKey = new Buffer.from(`${foodItem}`).toString("base64");

//getting the data from the cache

client.hget(hashKey, foodItem, async (err, recipe) => {
  //...the rest of the function.

  //setting the data to cache.

  client.hset(hashKey, foodItem, JSON.stringify(recipe.data.results));

  //setting the expiration time to 24 minutes.

  client.expire(hashKey, 1440);
});
```

- **Do we want the cache mechanism in each query**: Most of the time, we don't want caching in some parts of our application. For example, if users login into your application, you should not cache the login process. This is because the process may return a token from the previous operation and may be expired. It is advisable not to apply caching to data that is real-time or that is frequently updated.

### Conclusion.

Caching is great in improving the user experience of an application. However, there are key considerations one should make while implementing caching. In this article, we have covered an introduction to caching and implemented caching on an Express.js REST API using redis. You can access the final code from [here](https://github.com/mwangiKibui/implementing-caching-in-nodejs).
