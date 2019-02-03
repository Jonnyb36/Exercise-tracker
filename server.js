const express = require('express')
const app = express()
const bodyParser = require('body-parser')
try{
  var mongoose = require('mongoose');
} catch (e) {
  console.log(e);
}

const cors = require('cors')

// global setting for safety timeouts to handle possible
let timeout = 10000;

app.get('/is-mongoose-ok', function(req, res) {
  if (mongoose) {
    res.json({isMongooseOk: !!mongoose.connection.readyState})
  } else {
    res.json({isMongooseOk: false})
  }
});

//ADD API ROUTER
var router = express.Router();

var enableCORS = function(req, res, next) {
  if (!process.env.DISABLE_XORIGIN) {
    var allowedOrigins = ['https://marsh-glazer.gomix.me','https://narrow-plane.gomix.me', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin;
    if(!process.env.XORIGIN_RESTRICT || allowedOrigins.indexOf(origin) > -1) {
      console.log(req.method);
      res.set({
        "Access-Control-Allow-Origin" : origin,
        "Access-Control-Allow-Methods" : "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers" : "Origin, X-Requested-With, Content-Type, Accept"
      });
    }
  }
  next();
};

app.use('/api/exercise', enableCORS, router);

router.use(bodyParser.urlencoded({extended: false}))
router.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

const User = require('./myApp.js').User;
const Exercise = require('./myApp.js').Exercise;

const findExistingUsername = require('./myApp.js').findExistingUsername;

const createAndSaveNewUser = require('./myApp.js').createAndSaveNewUser;
router.post('/new-user', function(req, res, next) {
  // in case of incorrect function use wait timeout then respond
  var t = setTimeout(() => { next({message: 'timeout'}) }, timeout);
  findExistingUsername(req.body.username, function(err, data) {
    clearTimeout(t);
    if(err) { return (next(err)); }
    if(!data) {
      createAndSaveNewUser(req.body.username, function(err, data) {
        clearTimeout(t);
        if(err) { return (next(err)); }
        if(!data) {
          console.log('Missing `done()` argument');
          return next({message: 'Missing callback argument'});
        }
         User.findById(data._id, function(err, user) {
           if(err) { return (next(err)); }
           res.json(user);
         });
      });
    }
    res.json({[req.body.username]: "already exists"});
  });
});

const createAndSaveNewExercise = require('./myApp.js').createAndSaveNewExercise;
router.post('/add', function(req, res, next) {
  var t = setTimeout(() => { next({message: 'timeout'}) }, timeout);
  createAndSaveNewExercise(req.body, function(err, data) {
    clearTimeout(t);
    if(err) { return (next(err)); }
    if(!data) {
      console.log('Missing `done()` argument');
      return next({message: 'Missing callback argument'});
    }
     
    Exercise.findById(data._id, function(err, exercise) {
        if(err) { return (next(err)); }
        User.findById(exercise.userId, function(err, user) {
          if(err) { return (next(err)); }
          res.json({
            username: user.username, 
            description: exercise.description, 
            duration: exercise.duration,
            _id: user._id,
            date: exercise.date.toUTCString()
          });
        });
     });
  });
});

const findExistingUserId = require('./myApp.js').findExistingUserId;

const getUserExerciseLog = require('./myApp.js').getUserExerciseLog;
//router.post('/log?{userId}[&from][&to][&limit]'
router.get('/log', function(req, res, next) {
  var t = setTimeout(() => { next({message: 'timeout'}) }, timeout);
  //check that query data has been added correctly
  if(req.query){
    //get the params from API string
    const userId = req.query.userId;
    const from = req.query.from ? req.query.from: null;
    const to = req.query.to ? req.query.to: null;
    const limit = req.query.limit ? req.query.limit: null;
    //find the user info then exercise log
    findExistingUserId(userId, function(err,data){
      clearTimeout(t);
      if(err) { return (next(err)); }
      if(!data) {
        console.log('Missing `done()` argument');
        return next({message: 'Missing callback argument'});
      }
      const userData = data;
      //find exercise log for user
      getUserExerciseLog(userId, from, to, parseInt(limit), function(err, exercises) {
        clearTimeout(t);
        if(err) { return (next(err)); }
        if(!exercises) {
          console.log('Missing `done()` argument');
          return next({message: 'Missing callback argument'});
        }
        res.json({_id:userData._id,username:userData.username, count:exercises.length, log:exercises});
      });
    });
  };
});

router.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    var userMap = {};

    users.forEach(function(user) {
      userMap[user._id] = user;
    });

    res.send(userMap);  
  });
});
