var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var db = require('../lib/mongoose.js');

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

/* GET index page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'MentorMatter' });
});

router.get('/home', function(req, res, next) {
  // db.findAllUsers();
  var id = req.cookies.id
  var allUsers;
  User.find({}).then(function (result) {
    allUsers = result
  })

  User.findOne({_id: id}).then(function (user) {
    var meetingList = [];
    var promiseArray = []
    for (var i = 0; i < user.meetings.length; i++) {
      var subProm = []
      user.meetings[i].meetingObj = {}
      user.meetings[i].meetingObj.date = user.meetings[i].date
      subProm.push(User.findOne({_id: user.meetings[i].creator}))
      subProm.push(User.findOne({_id: user.meetings[i].invitee}))
      promiseArray.push(Promise.all(subProm))
    }
    Promise.all(promiseArray).then(function (data) {
      user.meetings.forEach(function (meeting, i) {

        if (meeting.creator.toString() === user._id.toString()) {
          meeting.meetingObj.creator = "you"
        } else {
          meeting.meetingObj.creator = data[i][0].name
        }

        if (meeting.invitee.toString() === user._id.toString()) {
          meeting.meetingObj.invitee = "you"
        } else {
          meeting.meetingObj.invitee = data[i][1].name
        }

      })
      console.log('meeting data!!!!', user.meetings)
      res.render('home', {id: user._id, name: user.name, connections: user.connections, meetings: user.meetings, allUsers: allUsers})
    })
  })
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
      password: password
    },
    function(err, user) {
      if (err) {
        console.log(err);
      } else {
        console.log("NEW USER CREATED:", user);
      }
    }
  ).then(function (newUser) {
    res.cookie('name', newUser.name)
    res.cookie('id', newUser._id)
    res.redirect('/home');
  })
});

router.post('/login', function (req, res, next) {
  User.findOne({email: req.body.email}).then(function(user){
    console.log(user);
    if (user === null) {
      res.render ('index', {msg: "User not found."})
    } else if (req.body.password === user.password) {
      res.cookie("id", user._id);
      res.cookie("name", user.name);
      res.redirect('/home');
    } else {
      res.render('index', {msg: "Password does not match."})
    }
  })
});

router.get('/logout', function (req, res, next) {
  res.clearCookie('id');
  res.clearCookie('name');
  res.redirect('/')
})

router.get('/deleteAcct', function (req, res, next) {
  User.findOne({_id: req.cookies.id}, function (err, record) {
    record.remove();
    res.clearCookie('id');
    res.clearCookie('name');
    res.redirect('/');
  });
})

router.get('/profile/:id', function (req, res, next) {
  var meetings = Meeting.find({creator: req.params.id}, function (err, meetingDocs) {
    return meetingDocs
  }).then(function (result) {
    return Meeting.find({invitee: req.params.id}, function (err, meetingDocs) {
      return meetingDocs.concat(result)
    })
  }).then(function (allMeetings) {
    User.findOne({_id: req.params.id}).then(function (record) {
      console.log("PROFILE FOR:", record);
      return record
    }).then(function (record) {
      res.render('profile', {id: req.cookies.id, thePerson: record, meetings: allMeetings})
    })
  })
})

router.post('/meeting/:id', function (req, res, next) {
  var date = req.body.date
  User.findOne({_id: req.params.id}).then(function (record) {
    return record
  }).then(function (record) {
    var newMeeting;
    Meeting.create(
      {
        date: req.body.date,
        creator: req.cookies.id,
        invitee: record._id
      },
      function(err, meeting) {
        if (err) {
          console.log(err);
        } else {
          newMeeting = meeting;
          console.log(meeting);
        }
      }
    ).then(function () {
      console.log("RECORD:", record.meetings);
      var meetTemp = record.meetings;
      meetTemp.push(newMeeting);
      console.log("NEW MEETING:", meetTemp);
      return User.update({_id: record._id}, {$set: {meetings: meetTemp}});
    }).then(function () {
      User.findOne({_id: req.cookies.id}).then(function (record) {
        var meetTemp = record.meetings;
        meetTemp.push(newMeeting);
        return User.update({_id: record._id}, {$set: {meetings: meetTemp}});
      })
    })
  });
  res.redirect('/profile/' + req.params.id)
})

router.get('/connect/:id', function (req, res, next) {

})

router.get('/disconnect/:id', function (req, res, next) {

})
module.exports = router;
