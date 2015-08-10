var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');

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
  mentor: String,
  student: String,
})

var User = mongoose.model("User", userSchema)
var Meeting = mongoose.model("Meeting", meetingSchema)

/* GET index page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'MentorMatter' });
});

router.get('/home', function(req, res, next) {
  User.findOne({_id: req.cookies.id}, function(err, user){
    var suggestions = [];
    var type;
    var connectionIds = user.connections;
    var connections = [];
    if (user.type === "mentor") {
      type = "student"
    } else {
      type = "mentor"
    }
    User.find({type: type}, function (err, users) {
      users.forEach(function (record) {
        suggestions.push(record)
      })
      Promise.all(connectionIds.map(function (id) {
        if (id) {
          return User.findOne({_id: id}, function (err, record) {
            // return record;
            connections.push(record)
            // console.log("CONN ARRAY:", connections);
            // return record
          })
          // console.log("CONNECTONS:", connections);
        }
        return connections
      })).then(function () {
        console.log("CURRENT USER:", user);
        res.render('home', {name: user.name, suggestions: suggestions, connections: connections});
      })
    })
  });
});

router.post('/create', function (req, res, next) {
  var type = req.body.type;
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  User.create(
    {
      type: type,
      name: name,
      email: email,
      password: password,
      connections: [],
      meetings: []
    },
    function(err, user) {
      if (err) {
        console.log(err);
      } else {
        console.log(user);
      }
    }
  );
  res.redirect('/home');
});

router.post('/login', function (req, res, next) {
  User.findOne({email: req.body.email}, function(err, user){
    console.log("user:", user);
    if (err) {
      console.log(err);
    } else {
      if (user === null) {
        res.render ('index', {msg: "User not found."})
      } else if (req.body.password === user.password) {
        res.cookie("id", user._id);
        res.redirect('/home');
      } else {
        res.render('index', {msg: "Password does not match."})
      }
    }
  });
});

router.get('/logout', function (req, res, next) {
  res.clearCookie('id');
  res.redirect('/');
});

router.get('/deleteAcct', function (req, res, next) {
  res.clearCookie('id');
  User.findOne({_id: req.cookies.id}, function (err, record) {
    record.remove();
    res.redirect('/');
  });
});

router.get('/profile/:id', function (req, res, next) {
  User.findOne({_id: req.params.id}, function (err, personDoc) {
    console.log("PROFILE FOR:", personDoc);
    Meeting.find({mentor: req.params.id}, function (err, meetingDocs) {
      res.render('profile', {thePerson: personDoc, meetings: meetingDocs})
    })
  });
});

router.get('/meeting/:id', function (req, res, next) {
  var date = new Date();
  var mentor = req.params.id;
  var student = req.cookies.id;
  Meeting.create(
    {
      date: date,
      mentor: mentor,
      student: student
    },
    function(err, meeting) {
      if (err) {
        console.log(err);
      } else {
        console.log(meeting);
      }
    }
  );
  res.redirect('/profile/' + req.params.id)
});

router.get('/connect/:id', function (req, res, next) {
  User.findOne({_id: req.cookies.id}).then(function (record) {
    var connections = record.connections.push(req.params.id);
    return record.connections
  }).then(function (result) {
    return User.update({_id: req.cookies.id}, {$set: {connections: result}})
  }).then(function () {
    User.findOne({_id: req.params.id}).then(function (record) {
      var connections = record.connections.push(req.cookies.id);
      return record.connections
    }).then(function (result) {
      return User.update({_id: req.params.id}, {$set: {connections: result}})
    })
  }).then(function () {
    res.redirect('/home');
  })
})

router.get('/disconnect/:id', function (req, res, next) {
  User.findOne({_id: req.cookies.id}).then(function (record) {
    var connections = record.connections;
    var connectionsTemp = connections.map(function (id) {
      if (id !== req.params.id) {
        return id;
      }
    })
    return connectionsTemp;
  }).then(function (result) {
    return User.update({_id: req.cookies.id}, {$set: {connections: result}})
  }).then(function () {
    User.findOne({_id: req.params.id}).then(function (record) {
      var connections = record.connections;
      var connectionsTemp = connections.map(function (id) {
        if (id !== req.cookies.id) {
          return id;
        }
      })
      return connectionsTemp;
    }).then(function (result) {
      return User.update({_id: req.params.id}, {$set: {connections: result}})
    })
  }).then(function () {
    res.redirect('/home')
  })
})

module.exports = router;
