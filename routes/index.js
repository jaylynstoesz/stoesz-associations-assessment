var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var lib = require('../lib/mongoose.js');
var msg = require('../lib/messages.js');

/* GET index page. */
router.get('/', function(req, res, next) {
  lib.getAllRecords()
  res.render('index', { title: 'MentorMatter' });
})

router.get('/deleteAllUsers', function (req, res, next) {
  lib.deleteAllUsers()
  res.redirect('/')
})

router.get('/deleteAllMeetings', function (req, res, next) {
  lib.deleteAllMeetings()
  res.redirect('/')
})
router.get('/viewAllMeetings', function (req, res, next) {
  lib.getAllMeetings()
  res.redirect('/')
})

router.get('/home', function(req, res, next) {
  // todo: reduce to 3 lines
  var id = req.cookies.id
  var allUsers;
  var user;

  lib.getAllRecords().then(function (users) {
    allUsers = users
    return allUsers
  }).then(function () {
    return lib.getOneUser(id)
  }).then(function (record) {
    user = record
    var promiseArray = user.meetings.map(lib.getMeetingInfo)
    return Promise.all(promiseArray)
  }).then(function (objs) {
    lib.join(user).then(function (joined) {
      res.render('home', {theUser: user, connections: user.connections, meetings: objs, joined: joined, allUsers: allUsers})
    })
  })
})

router.post('/create', function (req, res, next) {
  var type = req.body.type;
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var confirm = req.body.confirm;
  var errors = msg.createErr(email, password, confirm)
  if (errors.length > 0) {
    res.render('index', {createErrors: errors, title: 'MentorMatter', type: type, name: name, email: email})
  } else {
    lib.createNewUser(type, name, email, password).then(function (newUser) {
      console.log("NEWUSER:", newUser);
      res.cookie('name', newUser.name)
      res.cookie('id', newUser._id)
      res.redirect('/home');
    });
  }
});

router.post('/login', function (req, res, next) {
  var email = req.body.emailLogin
  var password = req.body.password
  var errors = msg.loginErr(email, password)
  if (errors.length > 0) {
    res.render('index', {loginErrors: errors, emailLogin: email, title: 'MentorMatter'})
  } else {
    lib.login(email, password).then(function (validate) {
      if (!validate.user) {
        res.render('index', {loginErrors: ["User not found. Please try again or create a new account."], emailLogin: email, title: 'MentorMatter'})
      } else if (!validate.password) {
        res.render('index', {loginErrors: ["Password does not match."], emailLogin: email, title: 'MentorMatter'})
      } else {
        res.cookie('id', validate.id)
        res.cookie('name', validate.name)
        res.redirect('/home')
      }
    })
  }
});

router.get('/logout', function (req, res, next) {
  res.clearCookie('id');
  res.clearCookie('name');
  res.redirect('/')
})

router.get('/deleteAcct', function (req, res, next) {
  lib.deleteAcct(req.cookies.id)
  res.clearCookie('id');
  res.clearCookie('name');
  res.redirect('/');
})

router.get('/profile/:id', function (req, res, next) {
  lib.getUserProfile(req.params.id, req.cookies.id).then(function (record) {
    res.render('profile', {id: req.cookies.id, thePerson: record})
  })
})

router.post('/setMeeting/:id', function (req, res, next) {
  var date = req.body.date;
  var topic = req.body.topic;
  var errors = msg.meetingErr(topic, date);
  if (errors.length > 0) {
    lib.getUserProfile(req.params.id, req.cookies.id).then(function (results) {
      res.render('profile', {id: req.cookies.id, thePerson: results, errors: errors, date: date, topic: topic})
    })
  } else {
    lib.createNewMeeting(date, req.cookies.id, req.params.id, topic).then(function (newMeeting) {
      lib.updateMeetings(req.cookies.id, req.params.id, newMeeting._id);
      res.redirect('/profile/' + req.params.id)
    })
  }
})

router.get('/connect/:id', function (req, res, next) {
  lib.connect(req.cookies.id, req.params.id);
  res.redirect('/profile/' + req.params.id)
})

router.get('/disconnect/:id', function (req, res, next) {
  lib.disconnect(req.cookies.id, req.params.id);
  res.redirect('/profile/' + req.params.id)
})


router.get('/meeting/:id', function (req, res, next) {
  lib.getMeetingInfo(req.params.id).then(function (record) {
    res.render('meeting', {theMeeting: record, id: req.cookies.id})
  })
})

router.post('/meeting/:id', function (req, res, next) {
  var topic = req.body.topic
  var date = req.body.date
  var errors = msg.meetingErr(topic, date);
  if (errors.length > 0) {
    lib.getMeetingInfo(req.params.id).then(function (record) {
      res.render('edit-meeting', {theMeeting: record, id: req.cookies.id, errors: errors, date: date, topic: topic})
    })
  } else {
    lib.updateThisMeeting(req.params.id, topic, date).then(function () {
      res.redirect('/meeting/' + req.params.id)
    })
  }
})

router.get('/meeting/:id/edit', function (req, res, next) {
  lib.getMeetingInfo(req.params.id).then(function (meeting) {
    res.render('edit-meeting', {theMeeting: meeting, id: req.cookies.id, })
  })
})

router.get('/meeting/:id/delete', function (req, res, next) {
  lib.getMeetingInfo(req.params.id).then(function (meeting) {
    lib.removeMeeting(meeting.creatorId, meeting.inviteeId, req.params.id)
    res.redirect('/home')
  })
})

module.exports = router;
