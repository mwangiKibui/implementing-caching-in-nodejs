
const express = require('express');

const {fetchFoodItem} = require('./controllers/recipe');

const app = express();

app.get(`/recipe/:foodItem`, fetchFoodItem);


const PORT = process.env.PORT || 3000;

app.listen(PORT,() => {
    console.log(`listening on ${PORT}`)
});