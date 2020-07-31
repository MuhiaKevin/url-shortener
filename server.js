'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { nanoid } = require('nanoid');

require('dotenv').config()
const cors = require('cors');
const app = express();


// links 
/**
 * https://www.mongodb.com/blog/post/quick-start-nodejs-mongodb--how-to-get-connected-to-your-database
 * https://zellwk.com/blog/local-mongodb/
 * https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/
 * 
 * **/

// Basic Configuration 
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

/** this project needs a db !! **/
// mongoose.connect(process.env.DB_URI);
// mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true } )


mongoose.connect(process.env.MONGO_LOCAL_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  console.log("Connected to Database");
}).catch((err) => {
  console.log("Not Connected to Database ERROR! ", err);
});
const db = mongoose.connection;

db.once('open', _ => {
  console.log('Database connected', process.env.MONGO_LOCAL_URI)
})

db.on('error', err => {
  console.error('connection error: ', err)
})


// Database stuff here
const Schema = mongoose.Schema;

const urlshortenerSchema = new Schema({
  original_url: String,
  short_url: String
})

const UrlShortener = mongoose.model('urlshortener', urlshortenerSchema);


/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.use((error, req, res, next) => {
  if (error.status) {
    res.status(error.status);
  } else {
    res.status(500)
  }

  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? 'Everything GOOD' : error.stack
  })
})


app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// redirects to the correct url
app.get('/api/shorturl/:shortenedurl', (req, res) => {
  let shortenedurl = req.params.shortenedurl;

  UrlShortener.find({ short_url: shortenedurl }, (error, data) => {
    if (error) console.error(error)

    let originalurl = data[0]['original_url']
    res.redirect(originalurl)
  })

})


app.post('/api/shorturl/new', (req, res, next) => {
  const { url } = req.body;
  let slug = nanoid(10).toLowerCase()
  // 1. step 1 check if the url is a valid


  // 2. Add url to the database
  try {
    let urlshortener = new UrlShortener({ original_url: url, short_url: slug })

    urlshortener.save((error, data) => {
      if (error) return console.error(error)
      console.log('Document inserted sucessfully')
    })

    res.json({ original_url: url, short_url: slug })
  } catch (error) {
    next(eror)
  }
})


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({ greeting: 'hello API' });
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});