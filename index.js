const express = require('express');
const mongoose = require('mongoose');
const apiRoute = require('./routes/api');

//database URI
const mongoURI = require('./config/keys.js').mongoURI;

const dbName = 'testdb';

//connection to mongoDB
mongoose.set('useCreateIndex', true);
const conn = mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true}, (err)=>{
    if(err){
        console.log('failed to connect to database\n'+err);
    }
    else{
        console.log('Database Connected...');
    }
});

//sets port to run on, used environment variable if deployed to platforms like heroku
const port = process.env.port || 3000;

//initialize app
const app = express();
    
app.use(express.json());    

//Use variable when connecting to route
app.use('/'+dbName,apiRoute);


//starts server
app.listen(port, function(){
    console.log('Touch down port',port);
});

