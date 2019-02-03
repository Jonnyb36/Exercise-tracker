const mongoose = require('mongoose', { useNewUrlParser: true })
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

//User
const userSchema = new mongoose.Schema({ username: {type: String, required: true}});
const User = mongoose.model('User', userSchema);
//Exercise
const exerciseSchema = new mongoose.Schema(
  { 
    userId: {type: Object, required: true}, 
    description: {type:String, required:true},
    duration: {type: Number, required:true},
    date: {type: Date}
  });
const Exercise = mongoose.model('Exercise', exerciseSchema);

const createAndSaveNewUser = function(user, done) {
  const newUser = new User({username:user});
  newUser.save(function (err, data) {
    if (err) return done(err);
    done(null, data);
  });
};

const findExistingUsername = function(username, done) {
  User.find({username:username}, function (err, user) {
    if (err) return done(err);
    done(null, user);
  });
};

const findExistingUserId = function(userId, done) {
  User.findById(userId, function (err, user) {
    if (err) return done(err);
    done(null, user);
  });
};

const createAndSaveNewExercise = function(body, done) {
  ////{"username":"Jonnyb361","description":"running","duration":10,"_id":"SkiVO4EEN","date":"Sun Feb 03 2019"}
  console.log(body);
  let exerciseDate = !body.date ? new Date(): new Date(body.date);
  const newExercise = new Exercise({
      userId:body.userId, 
      description: body.description, 
      duration: body.duration, 
      date: exerciseDate
  });
  newExercise.save(function (err, data) {
    if (err) return done(err);
    done(null, data);
  });
};

const getUserExerciseLog = function(userId, from, to, limit, done) {
  console.log(userId, from, to, limit);
  const toDate = to? new Date(to): new Date();
  //new Date(from) || null
  Exercise.find({userId: userId})
    .where('date').gte(new Date(from)).lte(toDate)
    .sort('date')
    .limit(limit) //works with null entry
    .exec(function(err, exercise) {
      if(err) return done(err);
      done(null, exercise);
  });
};

//export the functions
exports.User = User;
exports.findExistingUsername = findExistingUsername;
exports.findExistingUserId = findExistingUserId;
exports.createAndSaveNewUser = createAndSaveNewUser;
exports.Exercise = Exercise;
exports.createAndSaveNewExercise = createAndSaveNewExercise;
exports.getUserExerciseLog = getUserExerciseLog;
