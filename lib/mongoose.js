var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mm');
mongoose.set('debug', true);

var userSchema = new mongoose.Schema({
  type: String,
  name: String,
  email: String,
  password: String,
  connections: Array,
  meetings: Array
})

var meetingSchema = new mongoose.Schema({
  date: Date,
  creator: String,
  invitee: String,
})

var User = mongoose.model("User", userSchema)
var Meeting = mongoose.model("Meeting", meetingSchema)

module.exports = {
  getAllUsers: function () {
    User.find({}).then(function (result) {
      return result
    })
  },

  createNewUser: function (type, name, email, password) {
    return User.create(
      {
        type: type,
        name: name,
        email: email,
        password: password
      },
      function(err, user) {
        if (err) {
          console.log(err);
        } else {
          console.log("NEW USER CREATED:", user);
        }
      }
    );
  },

  deleteAcct: function (id) {
    User.findOne({_id: id}).then(function (record) {
      record.remove();
    })
  },

  login: function (email, password) {
    var validate = {}
    validate.user = true;
    validate.password = true;
    return User.findOne({email: email}).then(function(user){
      console.log(user);
      validate.id = user._id
      validate.name = user.name
      if (user === null) {
        validate.user = false;
      } else if (password !== user.password) {
        validate.password = false;
      }
      console.log("LIB VAL:", validate);
      return validate
    })
  }

}
