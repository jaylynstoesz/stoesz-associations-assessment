var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var lib = require('../lib/mongoose.js');
var msg = require('../lib/messages.js');

/* GET index page. */
router.get('/', function(req, res, next) {
  lib.getAllRecords().then(function () {
    res.render('index', { title: 'MentorMatter' });
  })
});

router.get('/deleteAllUsers', function (req, res, next) {
  lib.deleteAllUsers().then(function () {
    lib.getAllRecords().then(function () {
      res.redirect('/');
    })
  })
});

router.get('/deleteAllMeetings', function (req, res, next) {
  lib.deleteAllMeetings().then(function () {
    lib.getAllMeetings().then(function () {
      res.redirect('/');
    })
  })
});

router.get('/home', function(req, res, next) {
  // db.findAllUsers();
  var id = req.cookies.id
  var allUsers;
  lib.getAllRecords().then(function (allUsers) {

    // var userMeetings
    lib.join(id).then(function (joined) {
      console.log("**********", joined);
      return joined
    }).then(function (joined) {
      return lib.getOneUser(id).then(function (user) {
        console.log("HOME PAGE FOR:", user);
        var promiseArray = []
        for (var i = 0; i < user.meetings.length; i++) {
          promiseArray.push(lib.getMeetingInfo(user.meetings[i]))
        }
        return Promise.all(promiseArray).then(function (objs) {
          objs.forEach(function (obj) {
            if (obj.creatorId.toString() === user._id.toString()) {
              obj.creator = "you"
            }
            if (obj.inviteeId.toString() === user._id.toString()) {
              obj.invitee = "you"
            }
          })
          res.render('home', {theUser: user, connections: user.connections, joined: joined, meetings: objs, allUsers: allUsers})
        })
      })

      // var meetingList = [];
      // var promiseArray = []
      // for (var i = 0; i < user.meetings.length; i++) {
      //   var subProm = []
      //   user.meetings[i].meetingObj = {}
      //   user.meetings[i].meetingObj.date = user.meetings[i].date
      //   subProm.push(User.findOne({_id: user.meetings[i].creator}))
      //   subProm.push(User.findOne({_id: user.meetings[i].invitee}))
      //   promiseArray.push(Promise.all(subProm))
      // }
      // Promise.all(promiseArray).then(function (data) {
      //   user.meetings.forEach(function (meeting, i) {
      //
      //     if (meeting.creator.toString() === user._id.toString()) {
      //       meeting.meetingObj.creator = "you"
      //     } else {
      //       meeting.meetingObj.creator = data[i][0].name
      //     }
      //
      //     if (meeting.invitee.toString() === user._id.toString()) {
      //       meeting.meetingObj.invitee = "you"
      //     } else {
      //       meeting.meetingObj.invitee = data[i][1].name
      //     }
      //
      //   })

      // console.log('meeting data!!!!', user.meetings)
      // console.log('allUsers!!!!', allUsers)
    })
  })
  // })

});

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
      console.log("INDX VAL:", validate);
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
  lib.deleteAcct(req.cookies.id).then(function () {
    res.clearCookie('id');
    res.clearCookie('name');
    res.redirect('/');
  })
})

router.get('/profile/:id', function (req, res, next) {
  lib.getOneUser(req.params.id).then(function (record) {
    var connected = false
    record.connections.forEach(function (connection) {
      if (connection === req.cookies.id) {
        connected = true
      }
    })
    Promise.all(record.connections.map(function (connection) {
      return lib.getOneUser(connection).then(function (result) {
        return result
      })
    })).then(function (results) {
      console.log("CONNECTIONS:", results);
      res.render('profile', {id: req.cookies.id, thePerson: record, connected: connected, connections: results})
    })
  })
})

router.post('/setMeeting/:id', function (req, res, next) {
  var date = req.body.date;
  var topic = req.body.topic;
  var errors = msg.meetingErr(topic, date);
  if (errors.length > 0) {
    lib.getOneUser(req.params.id).then(function (record) {
      console.log("PROFILE FOR:", record);
      Promise.all(record.connections.map(function (connection) {
        return lib.getOneUser(connection).then(function (result) {
          return result
        })
      })).then(function (connections) {
        res.render('profile', {thePerson: record, id: req.cookies.id, connected: true, connections: connections, errors: errors, date: date, topic: topic})
      })
    })
  } else {
    lib.createNewMeeting(date, req.cookies.id, req.params.id, topic).then(function (newMeeting) {
      console.log("NEW MEETING:", newMeeting);
      lib.updateMeetings(req.cookies.id, newMeeting._id);
      lib.updateMeetings(req.params.id, newMeeting._id);
      res.redirect('/profile/' + req.params.id)
    })
  }
})

router.get('/connect/:id', function (req, res, next) {
  lib.getOneUser(req.cookies.id).then(function (user) {
    lib.connect(user._id, req.params.id);
    lib.connect(req.params.id, user._id);
    res.redirect('/profile/' + req.params.id)
  })
})

router.get('/disconnect/:id', function (req, res, next) {
  lib.disconnect(req.cookies.id, req.params.id);
  lib.disconnect(req.params.id, req.cookies.id);
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
    return lib.removeMeeting(meeting.creatorId, req.params.id).then(function (result) {
      return result
    }).then(function () {
      return lib.removeMeeting(meeting.inviteeId, req.params.id).then(function (result) {
        return result
      })
    }).then(function () {
      return lib.deleteMeeting(meeting._id)
    }).then(function () {
      res.redirect('/home')
    })
  })
})

module.exports = router;
