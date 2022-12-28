'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {
  setDebugging,
  log,
  logEr,
  logPropsOf,
  logRequest,
  logQuery,
  logParams,
  logBody
} = require('./log-utils');
require('dotenv').config();

setDebugging(process.env.DEBUG == 'yes');

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({ origin: '*' })); //USED FOR FCC TESTING PURPOSES ONLY!

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);

//404 Not Found Middleware
app.use(function (req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

mongoose.connect(process.env.MONGO_URI)
  .then(data => {
    console.log('!!! Successfully connected to mongodb !!!');
    //Start our server and tests!
    const listener = app.listen(process.env.PORT || 3000, function () {
      console.log('Your app is listening on port ' + listener.address().port);
      if (process.env.NODE_ENV === 'test') {
        console.log('Running Tests...');
        setTimeout(function () {
          try {
            runner.run();
          } catch (e) {
            console.log('Tests are not valid:');
            console.error(e);
          }
        }, 1500);
      }
    });
  })
  .catch(e => {
    logEr('Could not connect to db.')
    logPropsOf('Error', e);
  });

module.exports = app; //for unit/functional testing
